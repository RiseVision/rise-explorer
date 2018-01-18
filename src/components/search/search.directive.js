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
import AppSearch from './search.module';
import template from './search.html';

AppSearch.directive('search', ($stateParams, $location, $timeout, Global, $http) => {
	const SearchCtrl = function () {
		const sch = this;
		this.loading = false;
		this.badQuery = false;

		const _badQuery = () => {
			this.badQuery = true;

			$timeout(() => {
				this.badQuery = false;
			}, 2000);
		};

		const _resetSearch = () => {
			this.q = '';
			this.loading = false;
		};

		this.search = () => {
			this.badQuery = false;
			this.loading = true;

			$http.get('/api/search', {
				params: {
					id: this.q,
				},
			}).then((resp) => {
				if (resp.data.success === false) {
					sch.loading = false;
					_badQuery();
				} else if (resp.data.id) {
					this.loading = false;
					_resetSearch();

					$location.path(`/${resp.data.type}/${resp.data.id}`);
				}
			});
		};
	};

	const SearchLink = function () {};

	return {
		restrict: 'E',
		link: SearchLink,
		controller: SearchCtrl,
		controllerAs: 'sch',
		template,
	};
});
