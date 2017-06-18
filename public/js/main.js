// Source: public/src/js/app.js
angular.module('lisk_explorer',[
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ngProgress',
    'ui.bootstrap',
    'gettext',
    'monospaced.qrcode',
    'lisk_explorer.system',
    'lisk_explorer.socket',
    'lisk_explorer.blocks',
    'lisk_explorer.transactions',
    'lisk_explorer.address',
    'lisk_explorer.search',
    'lisk_explorer.tools',
    'lisk_explorer.currency'
]);

angular.module('lisk_explorer.system', []);
angular.module('lisk_explorer.socket', []);
angular.module('lisk_explorer.blocks', []);
angular.module('lisk_explorer.transactions', []);
angular.module('lisk_explorer.address', []);
angular.module('lisk_explorer.search', []);
angular.module('lisk_explorer.tools', ['naturalSort']);
angular.module('lisk_explorer.currency', []);

// Source: public/src/js/controllers/activityGraph.js
angular.module('lisk_explorer.tools').controller('ActivityGraph',
  function (activityGraph, $scope) {
      activityGraph($scope);
  });

// Source: public/src/js/controllers/address.js
angular.module('lisk_explorer.address').controller('AddressController',
  function ($scope, $rootScope, $routeParams, $location, $http, addressTxs) {
      $scope.getAddress = function () {
          $http.get('/api/getAccount', {
              params : {
                  address : $routeParams.address
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.address = resp.data;
              } else {
                  throw 'Account was not found!';
              }
          }).catch(function (error) {
              $location.path('/');
          });
      };

      $scope.address = {
          address : $routeParams.address
      };

      $scope.getAddress();
      $scope.txs = addressTxs($routeParams.address);
  });

// Source: public/src/js/controllers/blocks.js
angular.module('lisk_explorer.blocks').controller('BlocksController',
  function ($scope, $rootScope, $routeParams, $location, $http, blockTxs) {
      $scope.getLastBlocks = function (n) {
          var offset = 0;

          if (n) {
              offset = (n - 1) * 20;
          }

          $http.get('/api/getLastBlocks?n=' + offset).then(function (resp) {
              if (resp.data.success) {
                  $scope.blocks = resp.data.blocks;

                  if (resp.data.pagination) {
                      $scope.pagination = resp.data.pagination;
                  }
              } else {
                  $scope.blocks = [];
              }
          });
      };

      $scope.getBlock = function (blockId) {
          $http.get('/api/getBlock', {
              params : {
                  blockId : blockId
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.block = resp.data.block;
              } else {
                  throw 'Block was not found!';
              }
          }).catch(function (error) {
              $location.path('/');
          });
      };

      if ($routeParams.blockId) {
          $scope.block = {
              id : $routeParams.blockId
          };
          $scope.getBlock($routeParams.blockId);
          $scope.txs = blockTxs($routeParams.blockId);
      } else if ($routeParams.page) {
          $scope.getLastBlocks($routeParams.page);
      } else {
          $scope.getLastBlocks();
      }
  });

// Source: public/src/js/controllers/currency.js
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

// Source: public/src/js/controllers/delegateMonitor.js
angular.module('lisk_explorer.tools').controller('DelegateMonitor',
  function (delegateMonitor, orderBy, $scope, $rootScope, $http) {
      delegateMonitor($scope);

      $scope.getStandby = function (n) {
          var offset = 0;

          if (n) {
              offset = (n - 1) * 20;
          }

          $scope.standbyDelegates = null;

          $http.get('/api/delegates/getStandby?n=' + offset).then(function (resp) {
              if (resp.data.success) {
                  _.each(resp.data.delegates, function (d) {
                      d.proposal = _.find ($rootScope.delegateProposals, function (p) {
                        return p.name === d.username.toLowerCase ();
                      });
                  });

                  $scope.standbyDelegates = resp.data.delegates;
              }
              if (resp.data.pagination) {
                  $scope.pagination = resp.data.pagination;
              }
          });
      };

      $scope.getStandby(1);

      $scope.tables = {
          active : orderBy('rate'),
          standby : orderBy('rate')
      };
  });

// Source: public/src/js/controllers/footer.js
angular.module('lisk_explorer.system').controller('FooterController',
  function ($scope) {

  });

// Source: public/src/js/controllers/header.js
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

// Source: public/src/js/controllers/index.js
angular.module('lisk_explorer.system').controller('IndexController',
  function ($scope, $http, $interval) {
      $scope.getLastBlocks = function () {
          $http.get('/api/getLastBlocks').then(function (resp) {
              if (resp.data.success) {
                  if ($scope.blocks && $scope.blocks.length > 0) {
                      if ($scope.blocks[0].id !== resp.data.blocks[0].id) {
                          $scope.blocks = resp.data.blocks;
                      }
                  } else {
                      $scope.blocks = resp.data.blocks;
                  }
              }
          });
      };

      $scope.blocksInterval = $interval(function () {
          $scope.getLastBlocks();
      }, 30000);

      $scope.getLastBlocks();

      $scope.getLastTransactions = function () {
          $http.get('/api/getLastTransactions').then(function (resp) {
              if (resp.data.success) {
                  if ($scope.txs && $scope.txs.length > 0) {
                      if ($scope.txs[0] !== resp.data.transactions[0]) {
                          $scope.txs = resp.data.transactions;
                      }
                  } else {
                      $scope.txs = resp.data.transactions;
                  }
              }
          });
      };

      $scope.transactionsInterval = $interval(function () {
          $scope.getLastTransactions();
      }, 30000);

      $scope.getLastTransactions();
  });

// Source: public/src/js/controllers/marketWatcher.js
angular.module('lisk_explorer.tools').controller('MarketWatcher',
  function (marketWatcher, $scope) {
      marketWatcher($scope);
  });

// Source: public/src/js/controllers/networkMonitor.js
angular.module('lisk_explorer.tools').controller('NetworkMonitor',
  function (networkMonitor, $scope) {
      networkMonitor($scope);
  });

// Source: public/src/js/controllers/search.js
angular.module('lisk_explorer.search').controller('SearchController',
  function ($scope, $routeParams, $location, $timeout, Global, $http) {
      $scope.loading = false;
      $scope.badQuery = false;

      var _badQuery = function () {
          $scope.badQuery = true;

          $timeout(function () {
              $scope.badQuery = false;
          }, 2000);
      };

      var _resetSearch = function () {
          $scope.q = '';
          $scope.loading = false;
      };

      $scope.search = function () {
          $scope.badQuery = false;
          $scope.loading = true;

          $http.get('/api/search', {
              params : {
                  id : $scope.q
              }
          }).then(function (resp) {
              if (resp.data.success === false) {
                  $scope.loading = false;
                  _badQuery();
              } else if (resp.data.id) {
                  $scope.loading = false;
                  _resetSearch();

                  $location.path('/' + resp.data.type + '/' + resp.data.id);
              }
          });
      };
  });

// Source: public/src/js/controllers/topAccounts.js
angular.module('lisk_explorer.address').controller('TopAccounts',
  function ($scope, lessMore) {
      $scope.topAccounts = lessMore({
          url : '/api/getTopAccounts',
          key : 'accounts'
      });
  });

// Source: public/src/js/controllers/transactions.js
angular.module('lisk_explorer.transactions').controller('TransactionsController',
  function ($scope, $rootScope, $routeParams, $location, $http) {
      $scope.getTransaction = function () {
          $http.get('/api/getTransaction', {
              params : {
                  transactionId : $routeParams.txId
              }
          }).then(function (resp) {
              if (resp.data.success) {
                  $scope.tx = resp.data.transaction;
              } else {
                  throw 'Transaction was not found!';
              }
          }).catch(function (error) {
              $location.path('/');
          });
      };

      $scope.getTransaction();
  });

// Source: public/src/js/directives/clipCopy.js
var ZeroClipboard = window.ZeroClipboard;

angular.module('lisk_explorer')
  .directive('clipCopy', function () {
      ZeroClipboard.config({
          moviePath: '/swf/ZeroClipboard.swf',
          trustedDomains: ['*'],
          allowScriptAccess: 'always',
          forceHandCursor: true
      });

      return {
          restric: 'A',
          scope: { clipCopy: '=clipCopy' },
          template: '<div class="tooltip fade right in"><div class="tooltip-arrow"></div><div class="tooltip-inner">Copied!</div></div>',
          link: function (scope, elm) {
              var clip = new ZeroClipboard(elm);

              clip.on('load', function (client) {
                  var onMousedown = function (client) {
                      client.setText(scope.clipCopy);
                  };

                  client.on('mousedown', onMousedown);

                  scope.$on('$destroy', function () {
                      client.off('mousedown', onMousedown);
                  });
              });

              clip.on('noFlash wrongflash', function () {
                  return elm.remove();
              });
          }
      };
  });

// Source: public/src/js/directives/delegateMonitor.js
angular.module('lisk_explorer.tools')
  .directive('forgingStatus', function ($sce) {
      return {
          restrict: 'A',
          scope: {
              forgingStatus: '=forgingStatus'
          },
          templateUrl: '/views/delegateMonitor/forgingStatus.html',
          replace: true,
          transclude: true,
          link: function (scope, element, attr) {
              var el = element[0];

              var updateStatus = function () {
                  element.removeClass('fa-circle-o').addClass('fa-circle');
                  scope.tooltip = {};

                  switch (scope.forgingStatus.code) {
                      case 3: // Awaiting slot, but forged in last round
                          element.removeClass('fa-circle red orange').addClass('fa-circle-o green');
                          scope.tooltip.html = '<span class="avaiting-slot">Awaiting slot</span>';
                          scope.tooltip.class = 'tooltip-grey';
                          break;
                      case 4: // Awaiting slot, but missed block in last round
                          element.removeClass('fa-circle green red').addClass('fa-circle-o orange');
                          scope.tooltip.html = '<span class="avaiting-slot">Awaiting slot</span>';
                          scope.tooltip.class = 'tooltip-grey';
                          break;
                      case 0: // Forged block in current round
                          element.removeClass('red orange').addClass('green');
                          scope.tooltip.html = '<span class="forging">Forging</span>';
                          scope.tooltip.class = 'tooltip-green';
                          break;
                      case 1: // Missed block in current round
                          element.removeClass('red green').addClass('orange');
                          scope.tooltip.html = '<span class="missed-block">Missed block</span>';
                          scope.tooltip.class = 'tooltip-orange';
                          break;
                      case 2: // Not Forging
                          element.removeClass('orange green').addClass('red');
                          scope.tooltip.html = '<span class="not-forging">Not forging</span>';
                          scope.tooltip.class = 'tooltip-red';
                          break;
                      default: // Awaiting Status
                          element.removeClass('fa-circle red orange green').addClass('fa-circle-o');
                          scope.tooltip.html = '<span class="awaiting-status">Awaiting status</span>';
                          scope.tooltip.class = 'tooltip-grey';
                  }

                  if (scope.forgingStatus.code < 5) {
                      if (scope.forgingStatus.blockAt) {
                        scope.tooltip.html += '<br> Last block forged ' + '@ ' + scope.forgingStatus.lastBlock.height + '<br>';
                        scope.tooltip.html +=  moment(scope.forgingStatus.blockAt).fromNow();
                      } else {
                        scope.tooltip.html += '<br> Not forged a block yet<br>';
                      }
                  }

                  scope.tooltip.html = $sce.trustAsHtml(scope.tooltip.html);
              };

              scope.$watch('forgingStatus', updateStatus, true);
          }
      };
  });

// Source: public/src/js/directives/depthChart.js
angular.module('lisk_explorer.tools')
  .directive('depthChart', function ($timeout) {
      function DepthChart (scope, elm, attr) {
          var self = this;

          this.style = {
              width: '100%',
              height: '500px'
          };

          this.config = {
              type: 'serial',
              theme: 'light',
              pathToImages: '/img/amcharts/',
              precision: 8,
              colors: ['#38B449', '#d32f2f'],
              dataProvider: [{}],
              valueAxes: [{
                  stackType: 'regular',
                  position: 'left',
                  dashLength: 5,
              }],
              graphs: [{
                  fillAlphas: 0.7,
                  lineAlpha: 0.5,
                  title: 'Bids',
                  valueField: 'bid'
              }, {
                  fillAlphas: 0.7,
                  lineAlpha: 0.5,
                  title: 'Asks',
                  valueField: 'ask'
              }],
              marginTop: 15,
              chartCursor: {
                  fullWidth: true,
                  cursorAlpha: 0.1,
                  valueBalloonsEnabled: true,
                  valueLineBalloonEnabled: true,
                  valueLineEnabled: true,
                  valueLineAlpha: 0.5,
                  cursorColor: '#0299eb'
              },
              categoryField: 'price',
              categoryAxis: {
                  startOnAxis: !0,
                  dashLength: 5,
                  labelRotation: 30,
                  labelFunction: function (n, t) {
                      return Number(t.category).toFixed(8);
                  }
              }
          };

          this.updateDepth = function () {
              var delay = 0;

              if (!scope.depthChart) {
                  delay = 500;
                  console.log('Initializing depth chart...');
                  scope.depthChart = AmCharts.makeChart('depthChart', self.config);
                  scope.depthChart.categoryAxesSettings = new AmCharts.CategoryAxesSettings();
              }

              $timeout(function () {
                  if (scope.tab !== 'depthChart') {
                      return;
                  }

                  if (_.size(scope.orders.depth) > 0) {
                      scope.depthChart.dataProvider = scope.orders.depth;
                      scope.depthChart.validateData();
                      console.log('Depth chart data updated');
                      elm.contents().css('display', 'block');
                  } else {
                      console.log('Depth chart data is empty');
                      scope.depthChart.dataProvider = [];
                      scope.depthChart.validateData();
                      elm.contents().css('display', 'none');
                      elm.prepend('<p class="amChartsEmpty"><i class="fa fa-exclamation-circle"></i> No Data</p>');
                  }

                  scope.$emit('$depthChartUpdated');
              }, delay);
          };

          elm.css('width', self.style.width);
          elm.css('height', self.style.height);
      }

      return {
          restric: 'E',
          replace: true,
          template: '<div id="depthChart"></div>',
          link: function (scope, elm, attr) {
              var depthChart = new DepthChart(scope, elm, attr);
              scope.$on('$ordersUpdated', depthChart.updateDepth);
          }
      };
  });

// Source: public/src/js/directives/marketWatcher.js
angular.module('lisk_explorer.tools')
  .directive('orders', function () {
      return {
          restrict: 'E',
          scope: {
              orders: '=orders',
              heading: '@heading',
              name: '@name'
          },
          templateUrl: '/views/marketWatcher/orders.html',
          replace: true
      };
  });

// Source: public/src/js/directives/networkMonitor.js
angular.module('lisk_explorer.tools')
  .directive('peers', function (orderBy) {
      return {
          restrict: 'E',
          scope: { peers: '=' },
          templateUrl: '/views/networkMonitor/peers.html',
          replace: true,
          link: function (scope, element, attr) {
              scope.table = orderBy('ip');
          }
      };
  })
  .directive('osIcon', function () {
      return {
          restrict: 'A',
          scope: {
              os: '=os',
              brand: '=brand'
          },
          template: '<span></span>',
          replace: true,
          link: function (scope, element, attr) {
              var el = element[0];

              el.alt = el.title = scope.os;
              el.className += (' os-icon os-' + scope.brand.name);
          }
      };
  });

// Source: public/src/js/directives/scroll.js
angular.module('lisk_explorer')
  .directive('scroll', function ($window) {
      return function (scope, element, attrs) {
          angular.element($window).bind('scroll', function () {
              if (this.pageYOffset >= 200) {
                  scope.secondaryNavbar = true;
              } else {
                  scope.secondaryNavbar = false;
              }
              scope.$apply();
          });
      };
  });

// Source: public/src/js/directives/stockChart.js
angular.module('lisk_explorer.tools')
  .directive('stockChart', function ($timeout) {
      function StockChart (scope, elm, attr) {
          var self = this;

          this.style = {
              width: '100%',
              height: '500px'
          };

          this.config = {
              type: 'stock',
              theme: 'light',
              pathToImages: '/img/amcharts/',
              dataSets: [{
                  fieldMappings: [{
                      fromField: 'date',
                      toField: 'date'
                  }, {
                      fromField: 'open',
                      toField: 'open'
                  }, {
                      fromField: 'close',
                      toField: 'close'
                  }, {
                      fromField: 'high',
                      toField: 'high'
                  }, {
                      fromField: 'low',
                      toField: 'low'
                  }, {
                      fromField: 'btcVolume',
                      toField: 'btcVolume'
                  }, {
                      fromField: 'liskVolume',
                      toField: 'liskVolume'
                  }, {
                      fromField: 'numTrades',
                      toField: 'numTrades'
                  }],
                  color: '#888888',
                  dataProvider: [],
                  categoryField: 'date'
              }],
              panels: [{
                  title: 'Price',
                  showCategoryAxis: false,
                  percentHeight: 70,
                  valueAxes: [{
                      id: 'v1',
                      dashLength: 5,
                      precision: 8
                  }],
                  categoryAxis: {
                      dashLength: 5,
                      parseDates: true
                  },
                  stockGraphs: [{
                      type: 'candlestick',
                      id: 'g1',
                      openField: 'open',
                      closeField: 'close',
                      highField: 'high',
                      lowField: 'low',
                      valueField: 'close',
                      lineColor: '#288234',
                      fillColors: '#38B449',
                      negativeLineColor: '#990000',
                      negativeFillColors: '#d32f2f',
                      fillAlphas: 0.7,
                      useDataSetColors: false,
                      comparable: false,
                      showBalloon: true,
                      balloonText: 'Open: <b>[[open]]</b><br>Close: <b>[[close]]</b><br>Low: <b>[[low]]</b><br>High: <b>[[high]]</b>',
                      balloonColor: '#888888',
                      proCandlesticks: true
                  }]
                },
                {
                    title: 'Volume',
                    percentHeight: 30,
                    marginTop: 1,
                    showCategoryAxis: true,
                    valueAxes: [{
                        dashLength: 5,
                        precision: 8
                    }],
                    categoryAxis: {
                        dashLength: 5,
                        parseDates: true
                    },
                    stockGraphs: [{
                        valueField: 'btcVolume',
                        periodValue: 'Sum',
                        type: 'column',
                        showBalloon: true,
                        balloonText: 'Volume: <b>[[value]]</b>',
                        balloonColor: '#888888',
                        fillAlphas: 1,
                        colors: 'black',
                        backgroundColors: 'black',
                        fillColors: 'black'
                    }]
                  }
              ],
              chartCursorSettings: {
                  fullWidth: true,
                  cursorAlpha: 0.1,
                  valueBalloonsEnabled: true,
                  valueLineBalloonEnabled: true,
                  valueLineEnabled: true,
                  valueLineAlpha: 0.5,
                  cursorColor: '#0299eb'
              },
              chartScrollbarSettings: {
                  graph: 'g1',
                  graphType: 'smoothedLine'
              },
              periodSelector: {
                  position: 'bottom',
                  periods: []
              }
          };

          this.dataSets = {
              minute: {
                  minPeriod: 'mm',
                  groupToPeriods: ['hh', 'DD', 'WW', 'MM', 'YYYY'],
                  periods: [{
                      period: 'MAX',
                      label: 'MAX',
                      selected: true
                  }, {
                      period: 'hh',
                      count: 12,
                      label: '12 Hours'
                  }, {
                      period: 'hh',
                      count: 6,
                      label: '6 Hours'
                  }, {
                      period: 'hh',
                      count: 3,
                      label: '3 Hours'
                  }]
              },
              hour: {
                  minPeriod: 'hh',
                  groupToPeriods: ['DD', 'WW', 'MM', 'YYYY'],
                  periods: [{
                      period: 'MAX',
                      label: 'MAX',
                      selected: true
                  }, {
                      period: 'MM',
                      count: 1,
                      label: '1 Month'
                  }, {
                      period: 'WW',
                      count: 1,
                      label: '1 Week'
                  }, {
                      period: 'DD',
                      count: 1,
                      label: '1 Day'
                  }]
              },
              day: {
                  minPeriod: 'DD',
                  groupToPeriods: ['WW', 'MM', 'YYYY'],
                  periods: [{
                      period: 'MAX',
                      label: 'MAX',
                      selected: true
                  }, {
                      period: 'MM',
                      count: 6,
                      label: '6 Months'
                  }, {
                      period: 'MM',
                      count: 3,
                      label: '3 Months'
                  }, {
                      period: 'MM',
                      count: 1,
                      label: '1 Month'
                  }]
              }
          };

          this.updatePeriod = function () {
              var newPeriod = (scope.newExchange || scope.newDuration);

              if (newPeriod) {
                  console.log('Updating period selector...');
                  scope.stockChart.categoryAxesSettings.minPeriod = self.dataSets[scope.duration].minPeriod;
                  scope.stockChart.periodSelector.periods = self.dataSets[scope.duration].periods;
                  scope.stockChart.validateNow();
              }

              return newPeriod;
          };

          this.updateCandles = function () {
              var delay = 0;

              if (!scope.stockChart) {
                  delay = 500;
                  console.log('Initializing stock chart...');
                  scope.stockChart = AmCharts.makeChart('stockChart', self.config);
                  scope.stockChart.categoryAxesSettings = new AmCharts.CategoryAxesSettings();
              }

              $timeout(function () {
                  if (scope.tab !== 'stockChart') {
                      return;
                  }

                  var newPeriod = self.updatePeriod(scope);

                  if (_.size(scope.candles) > 0) {
                      console.log('Stock chart data updated');
                      scope.stockChart.dataSets[0].dataProvider = scope.candles;
                      scope.stockChart.validateData();
                      elm.contents().css('display', 'block');
                  } else {
                      console.log('Stock chart data is empty');
                      scope.stockChart.dataSets[0].dataProvider = [];
                      scope.stockChart.validateNow();
                      elm.contents().css('display', 'none');
                      elm.prepend('<p class="amChartsEmpty"><i class="fa fa-exclamation-circle"></i> No Data</p>');
                  }

                  if (newPeriod) {
                      scope.stockChart.periodSelector.setDefaultPeriod();
                      console.log('Default period set');
                  }

                  scope.$emit('$stockChartUpdated');
              }, delay);
          };

          elm.css('width', self.style.width);
          elm.css('height', self.style.height);
      }

      return {
          restric: 'E',
          replace: true,
          template: '<div id="stockChart"></div>',
          link: function (scope, elm, attr) {
              var stockChart = new StockChart(scope, elm, attr);
              scope.$on('$candlesUpdated', stockChart.updateCandles);
          }
      };
  });

// Source: public/src/js/directives/whenScrolled.js
angular.module('lisk_explorer')
  .directive('whenScrolled', function ($window) {
      return {
          restric: 'A',
          link: function (scope, elm, attr) {
              var pageHeight, clientHeight, scrollPos;
              $window = angular.element($window);

              var handler = function () {
                  pageHeight = window.document.documentElement.scrollHeight;
                  clientHeight = window.document.documentElement.clientHeight;
                  scrollPos = window.pageYOffset;

                  if (pageHeight - (scrollPos + clientHeight) === 0) {
                      scope.$apply(attr.whenScrolled);
                  }
              };

              $window.on('scroll', handler);

              scope.$on('$destroy', function () {
                  return $window.off('scroll', handler);
              });
          }
      };
  });

// Source: public/src/js/services/activityGraph.js
var ActivityGraph = function () {
    this.loading   = true;
    this.blocks    = 0;
    this.maxBlocks = 20;
    this.indexes   = [];

    this.colors = {
        account: '#0288d1', // Steel Blue
        credit:  '#7CB342', // Lawn Green
        debit:   '#d32f2f', // Red
        block:   '#f57c00', // Dark Orange
        tx:      '#5f696e'  // Grey
    };

    this.renderer = {
        container: 'sigma-canvas',
        type: 'canvas'
    };

    this.settings = {
        sideMargin: 1,
        singleHover: true,
        minNodeSize: 0.5,
        maxNodeSize: 16,
        drawLabels: false,
        defaultEdgeType: 'arrow'
    };

    this.sigma = new sigma({
        renderer: this.renderer,
        settings: this.settings
    });

    function NodeSelect(sigma) {
        this.sigma = sigma;
        this.color = '#5bc0de';

        this.add = function (event) {
            this.remove(event);
            this.node       = event.data.node;
            this.prevColor  = this.node.color;
            this.node.color = this.color;
            this.sigma.refresh();
        };

        this.remove = function (event) {
            if (this.node) {
                this.node.color = this.prevColor;
                this.prevColor  = undefined;
                this.node       = undefined;
            }
            this.sigma.refresh();
        };

        this.selected = function () {
            return this.node !== undefined;
        };

        this.type = function () {
            if (this.selected()) {
                return this.node.type;
            } else {
                return undefined;
            }
        };

        this.href = function () {
            switch (this.type()) {
                case 0:
                return '/tx/' + this.node.id;
                case 1:
                return '/block/' + this.node.id;
                case 2:
                return '/address/' + this.node.id;
                default:
                return '#';
            }
        };
    }

    this.nodeSelect = new NodeSelect(this.sigma);

    function CameraMenu(camera) {
        this.camera = camera;

        this.reset = function () {
            if (this.camera) {
                this.camera.goTo({ x: 0, y: 0, angle: 0, ratio: 1 });
            }
        };
    }

    this.cameraMenu = new CameraMenu(this.sigma.camera);

    function Statistics(graph) {
        this.graph  = graph;
        this.volume = this.txs = this.blocks = this.accounts = 0;

        this.refresh = function () {
            var txs      = this.graph.nodesByType(0);
            var blocks   = this.graph.nodesByType(1);
            var accounts = this.graph.nodesByType(2);

            this.txs       = txs.size().value();
            this.volume    = txsVolume(txs);
            this.blocks    = blocks.size().value();
            this.beginning = minTime(blocks);
            this.end       = maxTime(blocks);
            this.accounts  = accounts.size().value();
        };

        var txsVolume = function (chain) {
            return chain.reduce(function (vol, tx) {
                return vol += tx.amount;
            }, 0).value();
        };

        var minTime = function (chain) {
            return chain.min(function (block) {
                if (block.timestamp > 0) {
                    return block.timestamp;
                }
            }).value().timestamp;
        };

        var maxTime = function (chain) {
            return chain.max(function (block) {
                if (block.timestamp > 0) {
                    return block.timestamp;
                }
            }).value().timestamp;
        };
    }

    this.statistics = new Statistics(this);
};

ActivityGraph.prototype.refresh = function (block) {
    if (block) {
        this.addBlock(block);
    }
    if (this.blocks > 0) {
        this.loading = false;
    }
    if (this.sigma) {
        this.sizeNodes();
        this.positionNodes();
        this.statistics.refresh();
        this.sigma.refresh();
    }
};

ActivityGraph.prototype.clear = function () {
    this.blocks  = 0;
    this.indexes = [];
    if (this.sigma) {
        this.sigma.graph.clear();
    }
};

ActivityGraph.prototype.sizeNodes = function () {
    _.each(this.sigma.graph.nodes(), function (node) {
        var deg = this.sigma.graph.degree(node.id);
        node.size = this.settings.maxNodeSize * Math.sqrt(deg);
    }, this);
};

ActivityGraph.prototype.nodesByType = function (type) {
    return _.chain(this.sigma.graph.nodes()).filter(function (node) {
        return node.type === type;
    });
};

ActivityGraph.prototype.positionNodes = function () {
    for (var type = 0; type < 3; type++) {
        var nodes = this.nodesByType(type).value();
        var i, len = nodes.length, slice = 2 * Math.PI / len;

        for (i = 0; i < len; i++) {
            var angle = slice * i, node = nodes[i];
            var graph = this.sigma.graph.nodes(node.id);
            graph.x = (type + 1) * Math.cos(angle);
            graph.y = (type + 1) * Math.sin(angle);
        }
    }
};

ActivityGraph.prototype.addNode = function (node) {
    if (!_.contains(this.indexes, node.id)) {
        node.x = Math.random();
        node.y = Math.random();
        this.indexes.push(node.id);
        this.sigma.graph.addNode(node);
    }
};

ActivityGraph.prototype.addEdge = function (edge) {
    if (!_.contains(this.indexes, edge.id)) {
        this.indexes.push(edge.id);
        this.sigma.graph.addEdge(edge);
    }
};

ActivityGraph.prototype.addTx = function (tx) {
    if (_.contains(this.indexes, tx.id)) { return; }
    this.addNode({
        id: tx.id,
        label: tx.id,
        type: 0,
        amount: tx.amount,
        color: this.colors.tx,
        size: 1
    });
    this.indexes.push(tx.id);
    this.addTxSender(tx);
    this.addTxRecipient(tx);
};

ActivityGraph.prototype.addAccount = function (id) {
    this.addNode({
        id: id,
        type: 2,
        label: id,
        color: this.colors.account,
        size: 1
    });
};

ActivityGraph.prototype.amount = function (tx, sign) {
    return (sign + tx.amount / Math.pow(10, 8)) + ' RISE';
};

ActivityGraph.prototype.addTxSender = function (tx) {
    this.addAccount(tx.senderId);
    this.addEdge({
        id: tx.id + tx.senderId + Math.random(),
        label: this.amount(tx, '-'),
        source: tx.senderId,
        target: tx.id,
        color: this.colors.debit,
        size: 1
    });
};

ActivityGraph.prototype.addTxRecipient = function (tx) {
    if (!tx.recipientId) { return; }
    this.addAccount(tx.recipientId);
    this.addEdge({
        id: tx.id + tx.recipientId + Math.random(),
        label: this.amount(tx, '+'),
        source: tx.id,
        target: tx.recipientId,
        color: this.colors.credit,
        size: 1
    });
};

ActivityGraph.prototype.addBlock = function (block) {
    if (_.contains(this.indexes, block.id)) { return; }
    if ((this.blocks + 1) > this.maxBlocks) { this.clear(); }
    this.addNode({
        id: block.id,
        label: block.id,
        timestamp: block.timestamp,
        type: 1,
        color: this.colors.block,
        size: 1
    });
    this.blocks++;
    this.indexes.push(block.id);
    this.addBlockGenerator(block);
    this.addBlockTxs(block);
};

ActivityGraph.prototype.addBlockGenerator = function (block) {
    this.addAccount(block.generatorId);
    this.addEdge({
        id: block.id + block.generatorId,
        label: block.height.toString(),
        source: block.generatorId,
        target: block.id,
        color: this.colors.account,
        size: 1
    });
};

ActivityGraph.prototype.addBlockTxs = function (block) {
    if (!_.isEmpty(block.transactions)) {
        _.each(block.transactions, function (tx) {
            this.addTx(tx);
            this.addEdge({
                id: block.id + tx.id,
                source: block.id,
                target: tx.id,
                color: this.colors.block,
                size: 1
            });
        }, this);
    }
};

angular.module('lisk_explorer.tools').factory('activityGraph',
  function ($socket) {
      return function ($scope) {
          var activityGraph = new ActivityGraph(),
              ns = $socket('/activityGraph');

          $scope.activityGraph = activityGraph;
          $scope.nodeSelect = activityGraph.nodeSelect;
          $scope.cameraMenu = activityGraph.cameraMenu;
          $scope.statistics = activityGraph.statistics;

          activityGraph.sigma.bind('clickNode', function (event) {
              $scope.$apply(function () {
                  activityGraph.nodeSelect.add(event);
              });
          });

          activityGraph.sigma.bind('clickStage doubleClickStage', function (event) {
              $scope.$apply(function () {
                  activityGraph.nodeSelect.remove(event);
              });
          });

          ns.on('data', function (res) { activityGraph.refresh(res.block); });

          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          $scope.$on('$locationChangeStart', function (event, next, current) {
              ns.emit('forceDisconnect');
          });

          return activityGraph;
      };
  });

// Source: public/src/js/services/addressTxs.js
angular.module('lisk_explorer.system').factory('addressTxs',
  function ($http, $q) {
      return function (address) {
          var lessMore = new LessMore($http, $q, {
              url     : '/api/getTransactionsByAddress',
              parent  : 'address',
              key     : 'transactions',
              address : address
          });

          lessMore.loadMore = function () {
              this.getData(0, 1, function (data) {
                  var changed = false;

                  if (this.results[0] && data[0]) {
                      changed = (this.results[0].id !== data[0].id);
                  }
                  if (changed) {
                      this.reloadMore();
                  } else {
                      LessMore.prototype.loadMore.call(this);
                  }
              }.bind(this));
          };

          return lessMore;
      };
  });

// Source: public/src/js/services/blockTxs.js
angular.module('lisk_explorer.system').factory('blockTxs',
  function ($http, $q) {
      return function (blockId) {
          var lessMore = new LessMore($http, $q, {
              url     : '/api/getTransactionsByBlock',
              parent  : 'block',
              key     : 'transactions',
              blockId : blockId
          });

          return lessMore;
      };
  });

// Source: public/src/js/services/delegateMonitor.js
var DelegateMonitor = function ($scope, $rootScope, forgingMonitor) {
    this.updateActive = function (active) {
        _.each(active.delegates, function (d) {
            d.forgingStatus = forgingMonitor.getStatus(d);
            d.proposal = _.find ($rootScope.delegateProposals, function (p) {
              return p.name === d.username.toLowerCase ();
            });
        });
        $scope.activeDelegates = active.delegates;

        updateForgingTotals(active.delegates);
        updateForgingProgress($scope.forgingTotals);
    };

    this.updateTotals = function (active) {
        $scope.totalDelegates = active.totalCount || 0;
        $scope.totalActive    = 101;

        if ($scope.totalDelegates > $scope.totalActive) {
            $scope.totalStandby = ($scope.totalDelegates - $scope.totalActive);
        } else {
            $scope.totalStandby = 0;
        }

        $scope.bestForger  = bestForger(active.delegates);
        $scope.totalForged = totalForged(active.delegates);
        $scope.bestProductivity  = bestProductivity(active.delegates);
        $scope.worstProductivity = worstProductivity(active.delegates);
    };

    this.updateLastBlock = function (lastBlock) {
        $scope.lastBlock = lastBlock.block;
    };

    this.updateRegistrations = function (registrations) {
        $scope.registrations = registrations.transactions;
    };

    this.updateNextForgers = function (nextForgers) {
        $scope.nextForgers = nextForgers;
    };

    this.updateVotes = function (votes) {
        $scope.votes = votes.transactions;
    };

    this.updateApproval = function (approval) {
        $scope.approval = approval;
    };

    this.updateLastBlocks = function (delegate) {
        _.each($scope.activeDelegates, function (d) {
            d.forgingStatus = forgingMonitor.getStatus(d);
        });

        var existing = _.find($scope.activeDelegates, function (d) {
            return d.publicKey === delegate.publicKey;
        });
        if (existing) {
            existing.blocksAt = delegate.blocksAt;
            existing.blocks = delegate.blocks;
            existing.forgingStatus = forgingMonitor.getStatus(delegate);
        }
        updateForgingTotals($scope.activeDelegates);
        updateForgingProgress($scope.forgingTotals);
    };

    // Private

    var bestForger = function (delegates) {
        if (_.size(delegates) > 0) {
            return _.max(delegates, function (d) { return parseInt(d.forged); });
        }
    };

    var totalForged = function (delegates) {
        return _.chain(delegates)
                .map(function (d) { return parseInt(d.forged); })
                .reduce(function (memo, num) { return parseInt(memo) + parseInt(num); }, 0)
                .value();
    };

    var bestProductivity = function (delegates) {
        if (_.size(delegates) > 0) {
            return _.max(delegates, function (d) { return parseFloat(d.productivity); });
        }
    };

    var worstProductivity = function (delegates) {
        if (_.size(delegates) > 0) {
            return _.min(delegates, function (d) { return parseFloat(d.productivity); });
        }
    };

    var updateForgingTotals = function (delegates) {
        $scope.forgingTotals = forgingMonitor.getforgingTotals(delegates);
    };

    var updateForgingProgress = function (totals) {
        totals.processed = forgingMonitor.getForgingProgress(totals);

        if (totals.processed > 0) {
            $scope.forgingProgress = true;
        }
    };
};

angular.module('lisk_explorer.tools').factory('delegateMonitor',
  function ($socket, $rootScope, forgingMonitor) {
      return function ($scope) {
          var delegateMonitor = new DelegateMonitor($scope, $rootScope, forgingMonitor),
              ns = $socket('/delegateMonitor');

          ns.on('data', function (res) {
              if (res.active) {
                  delegateMonitor.updateActive(res.active);
                  delegateMonitor.updateTotals(res.active);
              }
              if (res.lastBlock) { delegateMonitor.updateLastBlock(res.lastBlock); }
              if (res.registrations) { delegateMonitor.updateRegistrations(res.registrations); }
              if (res.nextForgers) { delegateMonitor.updateNextForgers(res.nextForgers); }
              if (res.votes) { delegateMonitor.updateVotes(res.votes); }
              if (res.approval) { delegateMonitor.updateApproval(res.approval); }
          });

          ns.on('delegate', function (res) {
              if (res.publicKey) {
                  delegateMonitor.updateLastBlocks(res);
              }
          });

          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          $scope.$on('$locationChangeStart', function (event, next, current) {
              ns.emit('forceDisconnect');
          });

          return delegateMonitor;
      };
  });

// Source: public/src/js/services/forgingMonitor.js
var ForgingMonitor = function (forgingStatus) {
    this.getStatus = function (delegate) {
        return forgingStatus(delegate);
    };

    this.getforgingTotals = function (delegates) {
        var cnt1 = _.countBy(delegates, function (d) {
            switch (d.forgingStatus.code) {
                case 0:
                case 3:
                    return 'forging';
                case 1:
                case 4:
                    return 'missedBlock';
                case 2:
                    return 'notForging';
                case 3:
                case 4:
                    return 'awaitingSlot';
                default:
                    return 'unprocessed';
            }
        });
        var cnt2 = _.countBy(delegates, function (d) {
            switch (d.forgingStatus.code) {
                case 3:
                case 4:
                    return 'awaitingSlot';
                default:
                    return 'unprocessed';
            }
        });

        cnt1.awaitingSlot = cnt2.awaitingSlot;
        return cnt1;
    };

    this.getForgingProgress = function (totals) {
        var unprocessed  = totals.unprocessed || 0;
            unprocessed += totals.staleStatus || 0;

        if (unprocessed > 0) {
            return (101 - unprocessed);
        } else {
            return 101;
        }
    };
};

angular.module('lisk_explorer.tools').service('forgingMonitor',
  function (forgingStatus) {
      return new ForgingMonitor(forgingStatus);
  });

// Source: public/src/js/services/forgingStatus.js
angular.module('lisk_explorer.tools').service('forgingStatus',
  function ($rootScope, epochStampFilter, roundFilter) {
      return function (delegate) {
          var status = { updatedAt: delegate.blocksAt },
              statusAge = 0, blockAge = 0;

          if (delegate.blocksAt && _.size(delegate.blocks) > 0) {
              status.lastBlock = _.first(delegate.blocks);
              status.blockAt   = epochStampFilter(status.lastBlock.timestamp);
              status.networkRound = roundFilter($rootScope.blockStatus.height);
              status.delegateRound = roundFilter(status.lastBlock.height);
              status.awaitingSlot = status.networkRound - status.delegateRound;

              statusAge = moment().diff(delegate.blocksAt, 'minutes');
              blockAge  = moment().diff(status.blockAt, 'minutes');
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

          delegate.status = [status.code, delegate.rate].join(':');
          return status;
      };
  });

// Source: public/src/js/services/global.js
// Global service for global variables
angular.module('lisk_explorer.system')
  .factory('Global', [ function () { return true; } ])
  .factory('Version',
    function ($resource) {
        return $resource('/api/version');
    });

// Source: public/src/js/services/header.js
var Header = function ($rootScope) {
    $rootScope.currency = {
      symbol: 'RISE'
    };

    this.updateBlockStatus = function (res) {
        if (res.success) {
            $rootScope.blockStatus = {
                height:    res.height,
                fee:       res.fee,
                milestone: res.milestone,
                reward:    res.reward,
                supply:    res.supply,
                nethash:   res.nethash
            };
        }
    };

    this.updatePriceTicker = function (res) {
        if (res.success) {
            $rootScope.currency.tickers = res.tickers;
        }

        // When ticker for user-stored currency is not available - switch to RISE temporarly
        if ($rootScope.currency.symbol !== 'RISE' && (!$rootScope.currency.tickers || !$rootScope.currency.tickers.RISE || !$rootScope.currency.tickers.RISE[$rootScope.currency.symbol])) {
            console.log ('Currency ' + $rootScope.currency.symbol + ' not available, fallback to RISE');
            $rootScope.currency.symbol = 'RISE';
        }
    };

    this.updateDelegateProposals = function (res) {
        if (res.success) {
            $rootScope.delegateProposals = res.proposals;
        } else {
            $rootScope.delegateProposals = [];
        }
    };
};

angular.module('lisk_explorer.system').factory('header',
  function ($rootScope, $socket) {
      return function ($scope) {
          var header = new Header($rootScope),
              ns = $socket('/header');

          ns.on('data', function (res) {
              if (res.status) { header.updateBlockStatus(res.status); }
              if (res.ticker) { header.updatePriceTicker(res.ticker); }
          });

          ns.on('delegateProposals', function (res) {
              if (res) { header.updateDelegateProposals(res); }
          });


          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          return header;
      };
  });

// Source: public/src/js/services/lessMore.js
var LessMore = function ($http, $q, params) {
    this.$http = $http;
    this.$q    = $q;

    this.url     = params.url     || '';
    this.parent  = params.parent  || 'parent';
    this.key     = params.key     || '';
    this.offset  = params.offset  || 0;
    this.maximum = params.maximum || 2000;
    this.limit   = params.limit   || 50;

    angular.forEach(['url', 'parent', 'key', 'offset', 'maximum', 'limit'], function (key) {
        delete params[key];
    });

    this.params   = params;
    this.results  = [];
    this.splice   = 0;
    this.loading  = true;
    this.moreData = false;
    this.lessData = false;
};

LessMore.prototype.disable = function () {
    this.moreData = this.lessData = false;
};

LessMore.prototype.disabled = function () {
    return !this.moreData && !this.lessData;
};

LessMore.prototype.getData = function (offset, limit, cb) {
    var params = angular.extend({ offset : offset, limit : limit }, this.params);

    this.disable();
    this.loading = true;
    this.$http.get(this.url, {
        params : params
    }).then(function (resp) {
        if (resp.data.success && angular.isArray(resp.data[this.key])) {
            cb(resp.data[this.key]);
        } else {
            throw 'LessMore failed to get valid response data';
        }
    }.bind(this));
};

LessMore.prototype.anyMore = function (length) {
    return (this.limit <= 1 && (this.limit % length) === 1) || (length > 1 && this.limit >= 1 && (length % this.limit) === 1);
};

LessMore.prototype.spliceData = function (data) {
    if (this.anyMore(angular.isArray(data) ? data.length : 0)) {
        this.moreData = true;
        data.splice(-1, 1);
    } else {
        this.moreData = false;
    }
};

LessMore.prototype.acceptData = function (data) {
    if (!angular.isArray(data)) { data = []; }
    this.spliceData(data);

    if (this.results.length > 0) {
        this.results = this.results.concat(data);
    } else {
        this.results = data;
    }

    if ((this.results.length + this.limit) > this.maximum) {
        this.moreData = false;
    }

    this.lessData = this.anyLess(this.results.length);
    this.loading = false;
    this.nextOffset();
};

LessMore.prototype.loadData = function () {
    this.getData(0, (this.limit + 1),
        function (data) {
            this.acceptData(data);
        }.bind(this));
};

LessMore.prototype.loadMore = function () {
    this.getData(this.offset, (this.limit + 1),
        function (data) {
            this.acceptData(data);
        }.bind(this));
};

LessMore.prototype.reloadMore = function () {
    var maxOffset = (this.offset + this.limit),
        promises = [],
        self = this;

    self.offset  = 0;
    self.results = [];

    for (var o = 0; o < maxOffset; o += self.limit) {
        var params = angular.extend({ offset : o, limit : self.limit + 1 }, self.params);
        promises.push(self.$http.get(self.url, { params : params }));
    }

    self.$q.all(promises).then(function (responses) {
        angular.forEach(responses, function (resp) {
            if (resp.data.success && angular.isArray(resp.data[this.key])) {
                self.acceptData(resp.data[self.key]);
            } else {
                throw 'LessMore failed to reload results on change';
            }
        });
    });
};

LessMore.prototype.nextOffset = function () {
    return this.offset += this.limit;
};

LessMore.prototype.prevOffset = function () {
    return this.offset -= this.limit;
};

LessMore.prototype.anyLess = function (length) {
    if (length > this.limit) {
        var mod = length % this.limit;
        this.splice = (mod === 0) ? this.limit : mod;
        return true;
    } else {
        this.splice = 0;
        return false;
    }
};

LessMore.prototype.loadLess = function () {
    this.lessData = false;
    this.moreData = true;
    if (angular.isArray(this.results)) {
        this.results.splice(-this.splice, this.splice);
        this.lessData = this.anyLess(this.results.length);
    }
    this.prevOffset();
};

angular.module('lisk_explorer.system').factory('lessMore',
  function ($http, $q) {
      return function (params) {
          return new LessMore($http, $q, params);
      };
  });

// Source: public/src/js/services/marketWatcher.js
var MarketWatcher = function ($q, $http, $scope) {
    var self = this,
        interval;
    $scope.exchanges = [];

    $scope.setTab = function (tab) {
        $scope.oldTab = $scope.tab;
        $scope.tab    = tab;

        if (!$scope.oldTab) { return; }
        console.log('Switched tab from', $scope.oldTab, 'to', $scope.tab);

        switch (tab) {
            case 'stockChart':
                if ($scope.oldTab !== 'stockChart') {
                    $scope.$broadcast('$candlesUpdated');
                }
                break;
            case 'depthChart':
                if ($scope.oldTab !== 'depthChart') {
                    $scope.$broadcast('$ordersUpdated');
                }
                break;
        }
    };

    $scope.setExchange = function (exchange, duration) {
        $scope.oldExchange = $scope.exchange;
        $scope.exchange = (exchange || $scope.exchange || _.first ($scope.exchanges));
        $scope.newExchange = ($scope.exchange !== $scope.oldExchange);
        if ($scope.newExchange) {
            console.log('Changed exchange from:', $scope.oldExchange, 'to:', $scope.exchange);
        }
        return $scope.setDuration(duration);
    };

    $scope.setDuration = function (duration) {
        $scope.oldDuration = $scope.duration;
        $scope.duration = (duration || $scope.duration || 'hour');
        $scope.newDuration = ($scope.duration !== $scope.oldDuration);
        if ($scope.newDuration) {
            console.log('Changed duration from:', $scope.oldDuration, 'to:', $scope.duration);
        }
        return getData();
    };

    var updateAll = function () {
        return $scope.newExchange || (!$scope.newExchange && !$scope.newDuration);
    };

    var getData = function () {
        console.log('New exchange:', $scope.newExchange);
        console.log('New duration:', $scope.newDuration);
        console.log('Updating all:', updateAll());

        $q.all([getCandles(), getStatistics(), getOrders()]).then(function (results) {
            if (results[0] && results[0].data) {
                $scope.candles = results[0].data.candles;
                $scope.$broadcast('$candlesUpdated');
                console.log('Candles updated');
            }
            if (results[1] && results[1].data) {
                $scope.statistics = results[1].data.statistics;
                $scope.$broadcast('$statisticsUpdated');
                console.log('Statistics updated');
            }
            if (results[2] && results[2].data) {
                $scope.orders = results[2].data.orders;
                $scope.$broadcast('$ordersUpdated');
                console.log('Orders updated');
            }
        });
    };

    var getExchanges = function () {
        console.log ('Retrieving exchanges...');
        $http.get('/api/exchanges').then (function (result) {
            if (result.data.success) {
                $scope.exchanges = _.keys (_.pick (result.data.exchanges, function (value, key) {
                    return value ? key : false;
                }));
                if ($scope.exchanges.length > 0) {
                    $scope.setExchange();
                    interval = setInterval(getData, 30000);
                }
            } else {
                $scope.exchanges = [];
            }
        });
    };

    var getCandles = function () {
        console.log('Retrieving candles...');
        return $http.get(['/api/exchanges/getCandles',
                   '?e=', angular.lowercase($scope.exchange),
                   '&d=', $scope.duration].join(''));
    };

    var getStatistics = function () {
        if (!updateAll()) { return; }
        console.log('Retrieving statistics...');
        return $http.get(['/api/exchanges/getStatistics',
                          '?e=', angular.lowercase($scope.exchange)].join(''));
    };

    var getOrders = function () {
        if (!updateAll()) { return; }
        console.log('Retrieving orders...');
        return $http.get(['/api/exchanges/getOrders',
                          '?e=', angular.lowercase($scope.exchange)].join(''));
    };

    getExchanges ();
    $scope.isCollapsed = false;

    $scope.$on('$locationChangeStart', function (event, next, current) {
        clearInterval(interval);
    });

    $scope.$on('$stockChartUpdated', function (event, next, current) {
        $scope.newExchange = $scope.newDuration = false;
    });
};

angular.module('lisk_explorer.tools').factory('marketWatcher',
  function ($q, $http, $socket) {
      return function ($scope) {
          var marketWatcher = new MarketWatcher($q, $http, $scope),
              ns = $socket('/marketWatcher');

          ns.on('data', function (res) {
          });

          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          $scope.$on('$locationChangeStart', function (event, next, current) {
              ns.emit('forceDisconnect');
          });

          return marketWatcher;
      };
  });

// Source: public/src/js/services/networkMonitor.js
var NetworkMonitor = function ($scope) {
    this.map = new NetworkMap();

    function Platforms () {
        this.counter   = [0,0,0,0];
        this.platforms = ['Darwin', 'Linux', 'Windows'];

        this.detect = function (platform) {
            if (angular.isNumber(platform.group)) {
                this.counter[parseInt(platform.group)]++;
            }
        };

        this.detected = function () {
            return {
                one:   { name: this.platforms[0], counter: this.counter[1] },
                two:   { name: this.platforms[1], counter: this.counter[2] },
                three: { name: this.platforms[2], counter: this.counter[3] },
                other: { name: null,              counter: this.counter[0] }
            };
        };
    }

    function Versions (peers) {
        var inspect = function () {
            if (angular.isArray(peers)) {
                return _.uniq(_.map(peers, function (p) { return p.version; })
                        .sort(), true).reverse().slice(0, 3);
            } else {
                return [];
            }
        };

        this.counter  = [0,0,0,0];
        this.versions = inspect();

        this.detect = function (version) {
            var detected = null;

            if (angular.isString(version)) {
                for (var i = 0; i < this.versions.length; i++) {
                    if (version === this.versions[i]) {
                        detected = version;
                        this.counter[i]++;
                        break;
                    }
                }
            }
            if (detected == null) {
                this.counter[3]++;
            }
        };

        this.detected = function (version) {
            return {
                one:   { num: this.versions[0], counter: this.counter[0] },
                two:   { num: this.versions[1], counter: this.counter[1] },
                three: { num: this.versions[2], counter: this.counter[2] },
                other: { num: null,             counter: this.counter[3] }
            };
        };
    }

    function Heights (peers) {
        var inspect = function () {
          function sortNumber(a,b) {
            return b - a;
          }
          if (angular.isArray(peers)) {
              return _.uniq(_.map(peers, function (p) { return p.height; })
                      .sort(sortNumber), true).slice(0, 4);
          } else {
              return [];
          }
        };

        this.counter = [0,0,0,0,0];
        this.percent = [0,0,0,0,0];
        this.heights = inspect();

        this.detect = function (height) {
            var detected = null;

            if (height) {
                for (var i = 0; i < this.heights.length; i++) {
                    if (height === this.heights[i]) {
                        detected = height;
                        this.counter[i]++;
                        break;
                    }
                }
            }
            if (detected == null) {
                this.counter[4]++;
            }
        };

        this.detected = function (height) {
            return {
                heights: this.heights,
                counter: this.counter
            };
        };

        this.calculatePercent = function (peers) {
            for (var i = 0; i < this.counter.length; i++) {
              this.percent[i] = Math.round((this.counter[i] / peers.length) * 100);
            }
            return this.percent;
        };
    }

    this.counter = function (peers) {
        var platforms = new Platforms(),
            versions  = new Versions(peers.connected),
            heights   = new Heights(peers.connected);

        for (var i = 0; i < peers.connected.length; i++) {
            var p = peers.connected[i];

            platforms.detect(p.osBrand);
            versions.detect(p.version);
            heights.detect(p.height);
        }

        return {
            connected: peers.connected.length,
            disconnected: peers.disconnected.length,
            total: peers.connected.length + peers.disconnected.length,
            platforms: platforms.detected(),
            versions: versions.detected(),
            heights: heights.detected(),
            percents: heights.calculatePercent (peers.connected)
        };
    };

    this.updatePeers = function (peers) {
        $scope.peers   = peers.list;
        $scope.counter = this.counter(peers.list);
        this.map.addConnected(peers.list);
    };

    this.updateLastBlock = function (lastBlock) {
        $scope.lastBlock = lastBlock.block;
    };

    this.updateBlocks = function (blocks) {
        $scope.bestBlock = blocks.best;
        $scope.volume    = blocks.volume;
    };
};

var NetworkMap = function () {
    this.markers = {};
    this.options = { center: L.latLng(40, 0), zoom: 1, minZoom: 1, maxZoom: 10 };
    this.map     = L.map('map', this.options);
    this.cluster = L.markerClusterGroup({ maxClusterRadius: 50 });

    L.Icon.Default.imagePath = '/img/leaflet';

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    var PlatformIcon = L.Icon.extend({
        options: {
            iconSize:   [32, 41],
            iconAnchor: [16, 41],
            popupAnchor: [0, -41]
        }
    });

    var platformIcons = {
        darwin:  new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-darwin.png' }),
        linux:   new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-linux.png' }),
        win:     new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-win.png' }),
        freebsd: new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-freebsd.png' }),
        unknown: new PlatformIcon({ iconUrl: '/img/leaflet/marker-icon-unknown.png' })
    };

    this.addConnected = function (peers) {
        var connected = [];

        for (var i = 0; i < peers.connected.length; i++) {
            var p = peers.connected[i];

            if (!validLocation(p.location)) {
                //console.warn('Invalid geo-location data received for:', p.ip);
                continue;
            }

            if (!_.has(this.markers, p.ip)) {
                this.cluster.addLayer(
                    this.markers[p.ip] = L.marker(
                        [p.location.latitude, p.location.longitude],
                        { title: p.ipString, icon: platformIcons[p.osBrand.name] }
                    ).bindPopup(popupContent(p))
                );
            }
            connected.push(p.ip);
        }

        this.removeDisconnected(connected);
        this.map.addLayer(this.cluster);
    };

    this.removeDisconnected = function (connected) {
        for (var ip in this.markers) {
            if (!_.contains(connected, ip)) {
                var m = this.markers[ip];

                this.map.removeLayer(m);
                this.cluster.removeLayer(m);
                delete this.markers[ip];
            }
        }
    };

    // Private

    var validLocation = function (location) {
        return location && angular.isNumber(location.latitude) && angular.isNumber(location.longitude);
    };

    var popupContent = function (p) {
        var content = '<p class="ip">'.concat(p.ip, '</p>');

        if (p.location.hostname) {
            content += '<p class="hostname">'
               .concat('<span class="label">Hostname: </span>', p.location.hostname, '</p>');
        }

        content += '<p class="version">'
           .concat('<span class="label">Version: </span>', p.version, '</p>');

        content += '<p class="os">'
           .concat('<span class="label">OS: </span>', p.os, '</p>');

        if (p.location.city) {
            content += '<p class="city">'
               .concat('<span class="label">City: </span>', p.location.city, '</p>');
        }

        if (p.location.region_name) {
            content += '<p class="region">'
               .concat('<span class="label">Region: </span>', p.location.region_name, '</p>');
        }

        if (p.location.country_name) {
            content += '<p class="country">'
               .concat('<span class="label">Country: </span>', p.location.country_name, '</p>');
        }

        return content;
    };
};

angular.module('lisk_explorer.tools').factory('networkMonitor',
  function ($socket) {
      return function ($scope) {
          var networkMonitor = new NetworkMonitor($scope),
              ns = $socket('/networkMonitor');

          ns.on('data', function (res) {
              if (res.peers) { networkMonitor.updatePeers(res.peers); }
              if (res.lastBlock) { networkMonitor.updateLastBlock(res.lastBlock); }
              if (res.blocks) { networkMonitor.updateBlocks(res.blocks); }
          });

          ns.on('data1', function (res) {
              if (res.lastBlock) {
                  networkMonitor.updateLastBlock(res.lastBlock);
              }
          });

          ns.on('data2', function (res) {
              if (res.blocks) {
                  networkMonitor.updateBlocks(res.blocks);
              }
          });

          ns.on('data3', function (res) {
              if (res.peers) {
                  networkMonitor.updatePeers(res.peers);
              }
          });

          $scope.$on('$destroy', function (event) {
              ns.removeAllListeners();
          });

          $scope.$on('$locationChangeStart', function (event, next, current) {
              ns.emit('forceDisconnect');
          });

          return networkMonitor;
      };
  });

// Source: public/src/js/services/orderBy.js
var OrderBy = function (predicate) {
    this.reverse   = false;
    this.predicate = predicate;

    this.order = function (predicate) {
        this.reverse = (this.predicate === predicate) ? !this.reverse : false;
        this.predicate = predicate;
    };
};

angular.module('lisk_explorer.system').factory('orderBy',
  function () {
      return function (predicate) {
          return new OrderBy(predicate);
      };
  });

// Source: public/src/js/services/socket.js
angular.module('lisk_explorer.socket').factory('$socket',
  function ($location, $rootScope) {
    return function (namespace) {
          var socket = io($location.host() + ':' + $location.port() + namespace, { 'forceNew': true });

          return {
              on: function (eventName, callback) {
                  socket.on(eventName, function () {
                      var args = arguments;

                      $rootScope.$apply(function () {
                          callback.apply(socket, args);
                      });
                  });
              },

              emit: function (eventName, data, callback) {
                  socket.emit(eventName, data, function () {
                      var args = arguments;

                      $rootScope.$apply(function () {
                          if (callback) {
                              callback.apply(socket, args);
                          }
                      });
                  });
              },

              removeAllListeners: function (eventName, callback) {
                  socket.removeAllListeners(eventName, function () {
                      var args = arguments;

                      $rootScope.$apply(function () {
                          callback.apply(socket, args);
                      });
                  });
              }
          };
      };
  });

// Source: public/src/js/services/txTypes.js
angular.module('lisk_explorer.system').value('txTypes', {
    0 : 'Normal transaction',
    1 : 'Second signature creation',
    2 : 'Delegate registration',
    3 : 'Delegate vote',
    4 : 'Multi-signature creation',
    5 : 'Dapp registration',
    7 : 'Dapp deposit',
    8 : 'Dapp withdrawal'
});

// Source: public/src/js/filters.js
angular.module('lisk_explorer')
  .filter('approval', function () {
      return function (votes) {
          if (isNaN(votes)) {
              return 0;
          } else {
              return ((parseInt(votes) / 1009000000000000) * 100).toFixed(2);
          }
      };
  })
  .filter('epochStamp', function () {
      return function (d) {
          return new Date(
              (((Date.UTC(2016, 4, 24, 17, 0, 0, 0) / 1000) + d) * 1000)
          );
      };
  })
  .filter('forgingTime', function () {
      return function (seconds) {
        if (seconds === 0) {
          return 'Now!';
        }
        var minutes = Math.floor(seconds / 60);
        seconds = seconds - (minutes * 60);
        if (minutes && seconds) {
          return minutes + ' min ' + seconds + ' sec';
        } else if (minutes) {
          return minutes + ' min ';
        } else {
          return seconds + ' sec';
        }
      };
  })
  .filter('fiat', function () {
      return function (amount) {
          if (isNaN(amount)) {
              return (0).toFixed(2);
          } else {
              return (parseInt(amount) / 100000000).toFixed(2);
          }
      };
  })
  .filter('lisk', function () {
      return function (amount) {
          if (isNaN(amount)) {
              return (0).toFixed(8);
          } else {
              return (parseInt(amount) / 100000000).toFixed (8).replace (/\.?0+$/, '');
          }
      };
  })
  .filter('currency', function (numberFilter, liskFilter) {
      return function (amount, currency, decimal_places) {
        var lisk = liskFilter (amount),
            factor = 1;

        if (currency.tickers && currency.tickers.RISE && currency.tickers.RISE[currency.symbol]) {
          factor = currency.tickers.RISE[currency.symbol];
        } else if (currency.symbol !== 'RISE') {
          // Exchange rate not available for current symbol
          return 'N/A';
        }

        if (decimal_places === undefined) {
          switch (currency.symbol) {
            case 'RISE':
            case 'BTC':
              return numberFilter ((lisk * factor), 8).replace (/\.?0+$/, '');
            default:
              return numberFilter ((lisk * factor), 2).replace (/\.?0+$/, '');
          }
        } else {
          return numberFilter ((lisk * factor), decimal_places);
        }
      };
  })
  .filter('nethash', function () {
      return function (nethash) {
          if (nethash === 'e90d39ac200c495b97deb6d9700745177c7fc4aa80a404108ec820cbeced054c') {
              return 'Testnet';
          } else if (nethash === 'cd8171332c012514864edd8eb6f68fc3ea6cb2afbaf21c56e12751022684cea5v')  {
              return 'Mainnet';
          } else {
              return 'Local';
          }
      };
  })
  .filter('round', function () {
      return function (height) {
          if (isNaN(height)) {
              return 0;
          } else {
              return Math.floor(height / 101) + (height % 101 > 0 ? 1 : 0);
          }
      };
  })
  .filter('split', function () {
      return function (input, delimiter) {
          delimiter = delimiter || ',';
          return input.split(delimiter);
      };
  })
  .filter('startFrom', function () {
      return function (input, start) {
          start = +start;
          return input.slice(start);
      };
  })
  .filter('supplyPercent', function () {
      return function (amount, supply) {
        var supply_check = (supply > 0);
          if (isNaN(amount) || !supply_check) {
            return (0).toFixed(2);
          }
          return (amount / supply * 100).toFixed(2);
      };
  })
  .filter('timeAgo', function (epochStampFilter) {
      return function (timestamp) {
          return moment(epochStampFilter(timestamp)).fromNow();
      };
  })
  .filter('timeSpan', function (epochStampFilter) {
      return function (a, b) {
          return moment.duration(
              epochStampFilter(a) - epochStampFilter(b)
          ).humanize();
      };
  })
  .filter('timestamp', function (epochStampFilter) {
      return function (timestamp) {
          var d     = epochStampFilter(timestamp);
          var month = d.getMonth() + 1;

          if (month < 10) {
              month = '0' + month;
          }

          var day = d.getDate();

          if (day < 10) {
              day = '0' + day;
          }

          var h = d.getHours();
          var m = d.getMinutes();
          var s = d.getSeconds();

          if (h < 10) {
              h = '0' + h;
          }

          if (m < 10) {
              m = '0' + m;
          }

          if (s < 10) {
              s = '0' + s;
          }

          return d.getFullYear() + '/' + month + '/' + day + ' ' + h + ':' + m + ':' + s;
      };
  })
  .filter('txSender', function () {
      return function (tx) {
          return ((tx.senderDelegate && tx.senderDelegate.username) || tx.senderUsername || (tx.knownSender && tx.knownSender.owner) || tx.senderId);
      };
  })
  .filter('address', function () {
      return function (a) {
          return (a.username || (a.knowledge && a.knowledge.owner) || a.address);
      };
  })
  .filter('txRecipient', function (txTypes) {
      return function (tx) {
          if (tx.type === 0) {
              return ((tx.recipientDelegate && tx.recipientDelegate.username) || tx.recipientUsername || (tx.knownRecipient && tx.knownRecipient.owner) || tx.recipientId);
          } else {
              return (txTypes[parseInt(tx.type)]);
          }
      };
  })
  .filter('txType', function (txTypes) {
      return function (tx) {
          return txTypes[parseInt(tx.type)];
      };
  })
  .filter('votes', function () {
      return function (a) {
          return (a.username || (a.knowledge && a.knowledge.owner) || a.address);
      };
  }).filter('proposal', function ($sce) {
      return function (name, proposals) {
          var p = _.find (proposals, function (p) {
              return p.name === name.toLowerCase ();
          });
          if (p) {
              return $sce.trustAsHtml('<a class="glyphicon glyphicon-user" href="https://forum.lisk.io/viewtopic.php?f=48&t=' + p.topic + '" title="' + _.escape (p.description) + '" target="_blank"></a> ' + name);
          } else {
              return $sce.trustAsHtml(name);
          }
      };
  });

// Source: public/src/js/config.js
// Setting up routes
angular.module('lisk_explorer').config(function ($routeProvider) {
    $routeProvider.
    when('/', {
        templateUrl: '/views/index.html',
        title: 'Home'
    }).
    when('/blocks/:page?', {
        templateUrl: '/views/blocks.html',
        title: 'Blocks'
    }).
    when('/block/:blockId', {
        templateUrl: '/views/block.html',
        title: 'Block '
    }).
    when('/tx/:txId', {
        templateUrl: '/views/transaction.html',
        title: 'Transaction '
    }).
    when('/address/:address', {
        templateUrl: '/views/address.html',
        title: 'Address'
    })
    .when('/activityGraph', {
        templateUrl : '/views/activityGraph.html',
        title: 'Activity Graph'
    })
    .when('/topAccounts', {
        templateUrl : '/views/topAccounts.html',
        title: 'Top Accounts'
    })
    .when('/delegateMonitor', {
        templateUrl : '/views/delegateMonitor.html',
        title: 'Delegate Monitor'
    })
    .when('/marketWatcher', {
        templateUrl : '/views/marketWatcher.html',
        title: 'Market Watcher'
    })
    .when('/networkMonitor', {
        templateUrl : '/views/networkMonitor.html',
        title: 'Network Monitor'
    })
    .otherwise({
        templateUrl: '/views/404.html',
        title: 'Error'
    });
});

// Setting HTML5 location mode
angular.module('lisk_explorer')
  .config(function ($locationProvider) {
      $locationProvider.html5Mode(true);
      $locationProvider.hashPrefix('!');
  })
  .run(function ($rootScope, $route, $location, $routeParams, $anchorScroll, $http, ngProgress, gettextCatalog) {
      gettextCatalog.currentLanguage = 'en';
      $rootScope.$on('$routeChangeStart', function () {
          ngProgress.start();
      });

      $rootScope.$on('$routeChangeSuccess', function () {
          ngProgress.complete();

          // Change page title, based on route information
          $rootScope.titleDetail = '';
          $rootScope.title = $route.current.title;
          $rootScope.isCollapsed = true;

          // Market Watcher
          $http.get('/api/exchanges').then (function (result) {
              if (result.data.success && result.data.enabled) {
                $rootScope.marketWatcher = true;
              }
          });

          $location.hash($routeParams.scrollTo);
          $anchorScroll();
      });
  });

// Source: public/src/js/init.js
angular.element(document).ready(
  function () {
      // Init the app
      // angular.bootstrap(document, ['lisk_explorer']);
  });

// Source: public/src/js/translations.js
angular.module('lisk_explorer').run(['gettextCatalog', function (gettextCatalog) {
/* jshint -W100 */
/* jshint +W100 */
}]);