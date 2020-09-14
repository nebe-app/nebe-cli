const {isSazka} = require('./configGetters');

module.exports = function apiUrl(url) {
	url = url.trim('/');

	return isSazka()
		? `https://beta.nebe.sazka.cz/nebe/api/public/cli/${url}`
		: `https://www.nebe.app/app/api/public/cli/${url}`;
};
