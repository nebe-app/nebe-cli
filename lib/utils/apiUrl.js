const {isSazka} = require('./configGetters');

module.exports = function apiUrl(url) {
	url = url.trim('/');

	return isSazka()
		? `https://sazka.nebe.app/api/public/cli/${url}`
		: `https://client.nebe.app/api/public/cli/${url}`;
};
