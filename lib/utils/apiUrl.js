const { getAppEnvironment} = require('./configGetters');
const argv = require('minimist')(process.argv.slice(2));

module.exports = function apiUrl(url) {
	url = url.trim('/');

	const isLocal = argv.local;

	if (isLocal) {
		return `http://localhost:8000/api/public/cli/${url}`;
	}

	const appEnvironment = getAppEnvironment();

	return appEnvironment === 'client'
		? `https://app.imagelance.com/api/public/cli/${url}`
		: `https://${appEnvironment}.imagelance.com/api/public/cli/${url}`;
};
