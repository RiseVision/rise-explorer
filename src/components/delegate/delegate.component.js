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
import AppDelegate from './delegate.module';
import template from './delegate.html';

const DelegateConstructor = function ($rootScope, $stateParams,
	$location, $http, addressTxs, $state) {
	const vm = this;
	$rootScope.breadCrumb = { address: $stateParams.delegateId };
	vm.getAddress = () => {
		$http.get('/api/getAccount', {
			params: {
				address: $stateParams.delegateId,
			},
		})
			.then((resp) => {
				$http.get('/api/getForgingChances')
					.then((fC) => {
						vm.address.forgingChances = fC.data
							.filter(f => f.publicKey === vm.address.publicKey)[0];
					});

				if (resp.data.success) {
					vm.address = resp.data;

					if (!vm.address.delegate) {
						$state.go('address', { address: $stateParams.delegateId });
					}
				} else {
					$state.go('home');
				}
			}).catch(() => {
				$location.path('/');
			});
	};


	vm.address = {
		address: $stateParams.delegateId,
	};

	// Sets the filter for which transactions to display
	vm.filterTxs = (direction) => {
		vm.direction = direction;
		vm.txs = addressTxs({ address: $stateParams.delegateId, direction });
	};

	vm.getAddress();
	vm.txs = addressTxs({ address: $stateParams.delegateId });
};

AppDelegate.component('delegate', {
	template,
	controller: DelegateConstructor,
	controllerAs: 'vm',
});
