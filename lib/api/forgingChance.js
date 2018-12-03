/*
 * LiskHQ/lisk-explorer
 * Copyright © 2018 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 *
 */
const request           = require('request');
const _                 = require('underscore');
const async             = require('async');
const BigNumber         = require('bignumber.js');
const { cachedRequest } = require('../cachedRequest');
const N                 = 101;
const M                 = 199;

let cache = {};
let roundCache = null;
module.exports = function (app) {

	function Calculator(round) {
		if (round !== roundCache) {
			cache = {};
		}
		this.delegates = function (cb) {
			if (cache.delegates) {
				return cb(null, cache.delegates);
			}
			async.parallel(
				[
					(ccb) => {
						request.get({
							url : `${app.get('lisk address')}/api/delegates/?orderBy=rank:asc&limit=101`,
							json: true,
						}, (err, response, body) => ccb(err, body.delegates));
					},
					(ccb) => {
						request.get({
							url : `${app.get('lisk address')}/api/delegates/?orderBy=rank:asc&limit=101&offset=101`,
							json: true,
						}, (err, response, body) => ccb(err, body.delegates));
					},
				],
				(err, res) => {
					if (err) return cb(err);
					const toRet = res[0].concat(res[1]).slice(0, M)
						.map((d) => {
							return {
								address  : d.address,
								username : d.username,
								publicKey: d.publicKey,
								vote     : d.votesWeight,
								rank     : d.rank,
							};
						});

						cache.delegates = toRet;
						return cb(null, toRet);
				});
		};

		this.calcPercentageV2 = function (delegates) {
			if (cache.percentages) {
				return cache.percentages;
			}
			const totalWeight = delegates
				.map(d => new BigNumber(d.vote))
				.reduce((a, b) => a.plus(b));


			const probByslotDel = [];
			probByslotDel[0]    = delegates
				.map(d => new BigNumber(d.vote).dividedBy(totalWeight));

			const cumulativeProbPerDelegates = delegates
				.map(d => new BigNumber(d.vote).dividedBy(totalWeight));

			let totalUsedWeightInPrevSlots = new BigNumber(0);
			for (let slot = 1; slot < N; slot++) {
				// Build previous slot used weight
				const usedWeightInPrevSlot = delegates
					.map((d, idx) => probByslotDel[slot - 1][idx].multipliedBy(d.vote))
					.reduce((a, b) => a.plus(b));

				totalUsedWeightInPrevSlots = totalUsedWeightInPrevSlots.plus(usedWeightInPrevSlot);
				probByslotDel[slot] = [];
				for (let i = 0; i < delegates.length; i++) {
					const d                       = delegates[i];
					probByslotDel[slot][i]        = new BigNumber(d.vote)
						.dividedBy(
							totalWeight
								.minus(totalUsedWeightInPrevSlots)
								.plus(cumulativeProbPerDelegates[i].multipliedBy(d.vote))
						)
						.multipliedBy(new BigNumber(1).minus(cumulativeProbPerDelegates[i]));

					cumulativeProbPerDelegates[i] = cumulativeProbPerDelegates[i]
						.plus(probByslotDel[slot][i]);
				}
			}

			const toRet = [];
			for (let i = 0; i < delegates.length; i++) {
				const { rank, vote, username, publicKey } = delegates[i];
				const includedProbability                 = cumulativeProbPerDelegates[i].multipliedBy(100).toFixed(3);
				toRet.push({
					rank,
					vote,
					username,
					publicKey,
					includedProbability,
				});
 			}
			cache.percentages = toRet;
			return toRet;
		};
	}

	this.getForgingChances = function (query, error, success) {
		async.waterfall(
			[
				cb => {
					request.get({
						url : app.get('lisk address') + '/api/loader/status/sync',
						json: true,
					}, (err, response, body) => {
						cb(null, body.height || 0);
					});
				},
				(height, cb) => {
					cb(null, new Calculator(Math.ceil(height / N)));
				},
				(calculator, cb) => {
					calculator.delegates((err, delegates) => {
						if (err) return cb(err);
						return cb(null, calculator, delegates);
					});
				},
				(calculator, delegates, cb) => {
					const r = calculator.calcPercentageV2(delegates);
					cb(null, r);
				},
			],
			(err, res) => {
				if (err) return error(err);
				return success(res);
			});
	};
};
