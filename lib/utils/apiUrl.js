const { getAppEnvironment } = require('./configGetters');
const argv = require('minimist')(process.argv.slice(2));

module.exports = function apiUrl(url) {
	url = url.trim('/');

	const isLocal = argv.local;

	if (isLocal) {
		return `http://localhost:8070/api/public/cli/${ url }`;
	}

	const appEnvironment = getAppEnvironment();

	// Legacy
	if (appEnvironment === 'sazka' || appEnvironment === 'sazkauat') {
		return `https://${ appEnvironment }.imagelance.com/api/public/cli/${ url }`;
	}

	return appEnvironment === 'client'
		? `https://api.app.imagelance.com/api/public/cli/${ url }`
		: `https://api.${ appEnvironment }.imagelance.com/api/public/cli/${ url }`;
};
