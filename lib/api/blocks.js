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
const {cachedRequest} = require('../cachedRequest');
const request = require('request');
const _       = require('underscore');
const async   = require('async');

module.exports = function (app) {
	this.getBlockHeight = function (error, success) {
		request.get({
			url: `${app.get('lisk address')}/api/blocks/getHeight`,
			json: true,
		}, (err, response, body) => {
			if (err || response.statusCode !== 200) {
				return error({ success: false, error: (err || 'Response was unsuccessful') });
			} else if (body.success === true) {
				return success({ success: true, height: body.height });
			}
			return error({ success: false, error: body.error });
		});
	};

	this.getBlockByHeight = function (height, error, success) {
		cachedRequest({
			url: `${app.get('lisk address')}/api/blocks?height=${height}`,
			json: true,
		}, app.locals.redis, 86400, (err, body) => {
			if (err) {
				return error({ success: false, error: (err || 'Response was unsuccessful') });
			} else if (body.success === true && body.count !== 0) {
				return success({ success: true, id: body.blocks[0].id, height: body.blocks[0].height, block: body.blocks[0] });
			}
			return error({ success: false, error: 'No block at specified height' });
		});
	};


	function Blocks() {
		this.offset = function (n) {
			n = parseInt(n, 10);

			if (isNaN(n) || n < 0) {
				return 0;
			}
			return n;
		};

		this.getDelegate = function (result, cb) {
			const block = result;

			return cachedRequest({
				url: `${app.get('lisk address')}/api/delegates/get?publicKey=${block.generatorPublicKey}`,
				json: true,
			}, app.locals.redis, 86400, (err, body) => {
				if (err) {
					return cb(err || 'Response was unsuccessful');
				} else if (body.success === true) {
					block.generator = body.delegate.address;
					block.delegate = body.delegate;
				} else {
					block.delegate = null;
				}
				return cb(null, result);
			});
		};

		this.map = function (body) {
			return _.map(body.blocks, b => ({
				id: b.id,
				timestamp: b.timestamp,
				generator: b.delegate.address,
				totalAmount: b.totalAmount,
				totalFee: b.totalFee,
				reward: b.reward,
				totalForged: b.totalFee + b.reward,
				transactionsCount: b.numberOfTransactions,
				height: b.height,
				delegate: b.delegate,
			}));
		};

		this.pagination = function (n, height) {
			const pagination = {};
			pagination.currentPage = parseInt(n / 20, 10) + 1;

			let totalPages = parseInt(height / 20, 10);
			if (totalPages < height / 20) { totalPages++; }

			if (pagination.currentPage > 1) {
				pagination.before = true;
				pagination.previousPage = pagination.currentPage - 1;
			}

			if (pagination.currentPage < totalPages) {
				pagination.more = true;
				pagination.nextPage = pagination.currentPage + 1;
			}

			return pagination;
		};
	}

	this.getLastBlocks = function (n, error, success) {
		const blocks = new Blocks();
		this.getBlockHeight(
			data => error({ success: false, error: data.error }),
			(data) => {
				if (data.success === true) {
					return async.parallel(
						new Array(20).fill(null).map((a, _idx) => data.height - _idx - (n?n:0))
							.map((blockHeight) => (cb) => this.getBlockByHeight(blockHeight, cb, (d) => cb(null, d.block))),
						(err, retBlocks) => {
							if (err) {
								return error({ success: false, error: (err || 'Response was unsuccessful') });
							} else {
								return async.forEach(retBlocks, (b, cb) => {
									blocks.getDelegate(b, cb);
								}, () => success({
									success: true,
									blocks: blocks.map({blocks: retBlocks}),
									pagination: blocks.pagination(n, data.height),
								}));
							}
						});
				}
				return error({ success: false, error: data.error });
			});
	};

	function Block() {
		const makeBody = function (body, height) {
			const b = body.block;

			b.confirmations = (height - b.height) + 1;
			b.payloadHash = new Buffer.alloc(parseInt(b.payloadHash, 10)).toString('hex');

			return body;
		};

		this.getBlock = function (blockId, height, cb) {
			request.get({
				url: `${app.get('lisk address')}/api/blocks/get?id=${blockId}`,
				json: true,
			}, (err, response, body) => {
				if (err || response.statusCode !== 200) {
					return cb(err || 'Response was unsuccessful');
				} else if (body.success === true) {
					return cb(null, makeBody(body, height));
				}
				return cb(body.error);
			});
		};

		this.getDelegate = function (result, cb) {
			const block = result.block;

			request.get({
				url: `${app.get('lisk address')}/api/delegates/get?publicKey=${block.generatorPublicKey}`,
				json: true,
			}, (err, response, body) => {
				if (err || response.statusCode !== 200) {
					return cb(err || 'Response was unsuccessful');
				} else if (body.success === true) {
					block.delegate = body.delegate;
				} else {
					block.delegate = null;
				}
				return cb(null, result);
			});
		};
	}

	this.getBlock = function (blockId, error, success) {
		const block = new Block();

		if (!blockId) {
			return error({ success: false, error: 'Missing/Invalid blockId parameter' });
		}
		return this.getBlockHeight(
			data => error({ success: false, error: data.error }),
			(data) => {
				if (data.success === false) {
					return error({ success: false, error: data.error });
				}
				return async.waterfall([
					function (cb) {
						block.getBlock(blockId, data.height, cb);
					},
					function (result, cb) {
						block.getDelegate(result, cb);
					},
				], (err, result) => {
					if (err) {
						return error({ success: false, error: err });
					}
					return success(result);
				});
			});
	};

	this.getHeight = function (height, error, success) {
		const block = new Block();

		if (!height) {
			return error({ success: false, error: 'Missing/Invalid height parameter' });
		}
		return this.getBlockByHeight(height,
			data => error({ success: false, error: data.error }),
			(data) => {
				if (data.success === false) {
					return error({ success: false, error: data.error });
				}
				return async.waterfall([
					function (cb) {
						block.getBlock(data.id, data.height, cb);
					},
					function (result, cb) {
						block.getDelegate(result, cb);
					},
				], (err, result) => {
					if (err) {
						return error({ success: false, error: err });
					}
					return success(result);
				});
			});
	};

	this.getBlockStatus = function (query, error, success) {
		request.get({
			url: `${app.get('lisk address')}/api/blocks/getStatus`,
			json: true,
		}, (err, response, body) => {
			if (err || response.statusCode !== 200) {
				return error({ success: false, error: (err || 'Response was unsuccessful') });
			} else if (body.success === true) {
				return success(body);
			}
			return error({ success: false, error: body.error });
		});
	};
};
