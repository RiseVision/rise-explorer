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
import AppServices from './services.module';

AppServices.service('forgingStatus',
	($rootScope, epochStampFilter, roundFilter) => (delegate) => {
		const status = { updatedAt: delegate.blocksAt };

		// if (delegate.blocksAt && _.size(delegate.blocks) > 0) {
		if (delegate.blocksAt && delegate.blocks.length > 0) {
			status.lastBlock = delegate.blocks[0];
			status.blockAt = epochStampFilter(status.lastBlock.timestamp);
			status.networkRound = roundFilter($rootScope.blockStatus.height);
			status.delegateRound = roundFilter(status.lastBlock.height);
			status.awaitingSlot = status.networkRound - status.delegateRound;
		} else {
			status.lastBlock = null;
		}

		if (status.awaitingSlot === 0) {
			// Forged block in current round
			status.code = 0;
		} else if (!delegate.isRoundDelegate && status.awaitingSlot === 1) {
			// Missed block in current round
			status.code = 1;
		} else if (!delegate.isRoundDelegate && status.awaitingSlot > 1) {
			// Missed block in current and last round = not forging
			status.code = 2;
		} else if (status.awaitingSlot === 1) {
			// Awaiting slot, but forged in last round
			status.code = 3;
		} else if (status.awaitingSlot === 2) {
			// Awaiting slot, but missed block in last round
			status.code = 4;
		} else if (!status.blockAt || !status.updatedAt) {
			// Awaiting status or unprocessed
			status.code = 5;
			// For delegates which not forged a signle block yet (statuses 0,3,5 not apply here)
		} else if (!status.blockAt && status.updatedAt) {
			if (!delegate.isRoundDelegate && delegate.missedblocks === 1) {
				// Missed block in current round
				status.code = 1;
			} else if (delegate.missedblocks > 1) {
				// Missed more than 1 block = not forging
				status.code = 2;
			} else if (delegate.missedblocks === 1) {
				// Missed block in previous round
				status.code = 4;
			}
		} else {
			// Not Forging
			status.code = 2;
		}

		if (status.code === 4 && delegate.cmb === 0) {
			status.code = 3;
		} else if (delegate.cmb > 0 && status.code === 5) {
			// User picked after a long time but cmb > 0 => not forging
			status.code = 2;
		}

		delegate.status = [status.code, delegate.rate].join(':');
		return status;
	});
