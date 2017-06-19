'use strict';

var config = {};
config.lisk = {};
config.freegeoip = {};
config.redis = {};
config.proposals = {};
config.exchangeRates = {exchanges: { RISE: {}, BTC: {}}};
config.marketWatcher = {exchanges: {}, candles: {}, orders: {}};

module.exports = config;
