const config = require('./config');

const isSazka = function () {
	const [, , ...args] = process.argv;

	if (args && args.join(' ').indexOf('--sazka') !== -1) {
		return true;
	}

	return !!global.sazka;
}

const getRoot = function () {
	return isSazka() ? config.get('rootSazka') : config.get('root');
}

const getLastDev = function () {
	return isSazka() ? config.get('lastDevSazka') : config.get('lastDev');
}

const getUsername = function () {
	return isSazka() ? config.get('usernameSazka') : config.get('username');
}

const getPassword = function () {
	return isSazka() ? config.get('passwordSazka') : config.get('password');
}

const setConfig = function (key, value) {
	return isSazka() ? config.set(key + 'Sazka', value) : config.set(key, value);
}

const getBin = function () {
	return isSazka() ? 'nebe-sazka' : 'nebe';
}

module.exports = {isSazka, getRoot, getLastDev, getUsername, getPassword, setConfig, getBin};
