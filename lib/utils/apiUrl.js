const {isSazka} = require('./configGetters');
const argv = require('minimist')(process.argv.slice(2));

module.exports = function apiUrl(url) {
	url = url.trim('/');

	const isLocal = argv.local;

	if (isLocal) {
		return `http://localhost:8000/api/public/cli/${url}`;
	}

	return isSazka()
		? `https://sazka.nebe.app/api/public/cli/${url}`
		: `https://client.nebe.app/api/public/cli/${url}`;
};
