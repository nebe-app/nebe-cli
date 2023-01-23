const config = require('./config');

const getAppEnvironment = function () {
	const [, , ...args] = process.argv;

	if (args && args.join(' ').indexOf('--sazka') !== -1) { // --sazka
		return 'sazka';
	}

	if (!args || args.join(' ').indexOf('--env=') === -1) { // No env argument
		return 'client';
	}

	for (let key in args) {
		if (args[key].indexOf('--env=') !== 0) {
			continue;
		}

		return args[key].replace('--env=', ''); // --env=sunny/uat/...
	}

	return 'client'; // default
}

const getConfigSuffix = function () {
	const appEnvironment = getAppEnvironment();
	return appEnvironment === 'client'
		? ''
		: appEnvironment.charAt(0).toUpperCase() + appEnvironment.slice(1);
}

const getRoot = function () {
	const suffix = getConfigSuffix();
	return config.get('root' + suffix);
}

const getLastDev = function () {
	const suffix = getConfigSuffix();
	return config.get('lastDev' + suffix);
}

const getUsername = function () {
	const suffix = getConfigSuffix();
	return config.get('username' + suffix);
}

const getPassword = function () {
	const suffix = getConfigSuffix();
	return config.get('password' + suffix);
}

const getConfig = function (name) {
	const suffix = getConfigSuffix();
	return config.get(name + suffix);
}

const setConfig = function (key, value) {
	const suffix = getConfigSuffix();
	return config.set(key + suffix, value);
}

const deleteConfig = function (key) {
	const suffix = getConfigSuffix();
	return config.delete(key + suffix);
}

const getCommand = function (command) {
	const appEnvironment = getAppEnvironment();
	return appEnvironment === 'client' ? `nebe ${ command }` : `nebe ${ command } --env=${ appEnvironment }`;
}

module.exports = { getAppEnvironment, getRoot, getLastDev, getUsername, getPassword, setConfig, deleteConfig, getConfig, getCommand };
