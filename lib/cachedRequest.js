const request = require('request');

module.exports.cachedRequest = function cachedRequest(requestOptions, redisClient, ttl, cback) {
	const k = requestOptions.url;
	redisClient.get(k, (err, obj) => {
		if (!err && obj) {
			return cback(null, JSON.parse(obj));
		}
		request.get(requestOptions, (err, response, body) => {
			if (!err && response.statusCode === 200) {
				redisClient.set(k, JSON.stringify(body), () => redisClient.expire(k, ttl));
				cback(null, body);
			} else {
				if (!err) {
					return cback(new Error('Response was unsuccessful'));
				}
				return cback(err);
			}
		});
	})
}
