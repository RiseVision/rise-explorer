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

		if (delegate.cmb > 0) {
			status.code = 2;
		} else {
			status.code = 3;
		}

		if (status.awaitingSlot === 0) {
			status.code = 0;
		}

		if (!delegate.isInRound) {
			status.code = 6; // Awaiting status
		}

		delegate.status = [status.code, delegate.rate].join(':');
		return status;
	});
