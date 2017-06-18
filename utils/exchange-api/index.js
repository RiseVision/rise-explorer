var request = require('request'),
    _ = require('underscore'),
    util = require('util'),
    async = require('async');

module.exports = function (config) {
    // No need to init if exchange rates are disabled
    if (!config.exchangeRates.enabled) {
        return false;
    }

    var exchanges = {
        'BTCUSD' : {
            'bitfinex' : [
                'Bitfinex',
                'https://api.bitfinex.com/v1/pubticker/BTCUSD',
                function (res, cb) {
                    if (res.message) {
                        return cb(res.message);
                    } else {
                        return cb(null, res.last_price);
                    }
                }
            ],
            'bitstamp' : [
                'Bitstamp',
                'https://www.bitstamp.net/api/v2/ticker/btcusd/',
                function (res, cb) {
                    return cb(null, res.last);
                }
            ],
            'btce' : [
                'Btc-e',
                'https://btc-e.com/api/3/ticker/btc_usd',
                function (res, cb) {
                  if (res.error) {
                      return cb(res.error);
                  } else {
                      return cb(null, res.btc_usd.last);
                  }
                }
            ]
        },
        'BTCEUR' : {
            'bitstamp' : [
                'Bitstamp',
                'https://www.bitstamp.net/api/v2/ticker/btceur/',
                function (res, cb) {
                    return cb(null, res.last);
                }
            ],
            'bitmarket' : [
                'Bitmarket',
                'https://www.bitmarket.pl/json/BTCEUR/ticker.json',
                function (res, cb) {
                    return cb(null, res.last);
                }
            ]
        },
        'BTCPLN' : {
            'bitmarket' : [
                'Bitmarket',
                'https://www.bitmarket.pl/json/BTCPLN/ticker.json',
                function (res, cb) {
                    return cb(null, res.last);
                }
            ]
        },
        'RISEBTC' : {
            bittrex : [
                'Bittrex',
                'https://bittrex.com/api/v1.1/public/getticker?market=BTC-RISE',
                function (res, cb) {
                    if (!res.success) {
                        return cb(res.error);
                    } else {
                        return cb(null, res.result.Last);
                    }
                }
            ]
        }
    };

    _.each(config.exchangeRates.exchanges, function (coin1, key1) {
        _.each(coin1, function (exchange, key2) {
            var pair = key1 + key2;
            if (!exchange) {
                return;
            }
            if (exchanges[pair].hasOwnProperty (exchange)) {
                console.log('Exchange:', util.format('Configured [%s] as %s/%s exchange', exchange, key1, key2));
                config.exchangeRates.exchanges[key1][key2] = exchanges[pair][exchange];
                config.exchangeRates.exchanges[key1][key2].pair = pair;
            } else if (exchanges[pair]) {
                var ex_name = Object.keys(exchanges[pair])[0];
                var ex = exchanges[pair][ex_name];
                console.log('Exchange:', util.format('Unrecognized %s/%s exchange', key1, key2));
                console.log('Exchange:', util.format('Defaulting to [%s]', ex_name));
                config.exchangeRates.exchanges[key1][key2] = ex;
                config.exchangeRates.exchanges[key1][key2].pair = pair;
            } else {
                console.log('Exchange:', util.format('Unrecognized %s/%s pair, deleted', key1, key2));
                remove (config.exchangeRates.exchanges[key1][key2]);
            }
        });
    });

    var requestTicker = function (options, cb) {
        request.get({
            url : options[1],
            json: true
        }, function (err, response, body) {
            if (err) {
                return cb(err);
            } else if (response.statusCode != 200) {
                return cb(util.format('Response code: %s!', response.statusCode));
            } else {
                return options[2](body, cb);
            }
        });
    };

    return {
        getPriceTicker: function (cb) {
            var currency = {},
                isNumeric = function (n) {
                  return !isNaN (parseFloat (n)) && isFinite (n);
                };

            async.forEachOf(config.exchangeRates.exchanges, function (exchange, key1, seriesCb, result) {
                currency[key1] = {};
                async.forEachOf(exchange, function (exchange2, key2, seriesCb2, result2) {
                    requestTicker(exchange2, function (err, result) {
                        if (result && isNumeric (result)) {
                            currency[key1][key2] = result;
                        } else {
                            console.log (util.format('Cannot receive exchange rates for %s/%s pair from [%s], ignored', key1, key2, exchange2[0]));
                        }
                        seriesCb2 (null, currency);
                    });
                }, 
                function(err) {
                    seriesCb (null, currency);
                });
            }, 
            function(err) {
                console.log ('Exchange rates:', currency);
                cb (null, currency);
            });
        }
    };
}
