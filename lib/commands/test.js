const config = require('../utils/config');

module.exports = class Test {
	help() {
		return `Test settings`;
	}

	async handle() {
		const root = config.get('root');

		if (!root) {
			console.error('Root directory is not set!');
		} else {
			console.info('Root set to: ' + root);
		}

		const username = config.get('username');

		if (!username) {
			console.error('Username is not set!');
		} else {
			console.info('Username set to: ' + username);
		}

		const password = config.get('password');

		if (!password) {
			console.error('Password is not set!');
		} else {
			console.info('Password set to: ' + password);
		}
	}
};
