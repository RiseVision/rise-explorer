'use strict';

angular.module ('lisk_explorer.currency').controller ('CurrencyController',
  function ($scope, $rootScope) {
    $rootScope.currency.symbol = localStorage && localStorage.getItem ('rise_explorer-currency') || 'RISE';

    $scope.setCurrency = function(currency) {
      $rootScope.currency.symbol = currency;
      if (localStorage) {
        localStorage.setItem ('rise_explorer-currency', currency);
      }
    };
  });
