const config = require('../utils/config');

module.exports = class Login {
	help() {
		return `Save login information`;
	}

	async handle(args) {
		console.log('login', args);

		if (args.length === 2) {
			const username = args[0];
			config.set('username', username);
			const password = args[1];
			config.set('password', password);

			console.log('Credentials saved');
		}
	}
};
