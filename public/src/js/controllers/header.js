'use strict';

angular.module('lisk_explorer.system').controller('HeaderController',
  function (header, $scope, $http) {
      $scope.getWalletAddress = function () {
          $http.get('/api/wallet').then(function (resp) {
              if (resp.data) {
                  $scope.walletAddress = resp.data.walletAddress;
              }
          });
      };
      $scope.getWalletAddress();

      header($scope);
  });
