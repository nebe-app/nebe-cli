const {deleteConfig} = require('../utils/configGetters');
const chalk = require('chalk');

module.exports = class Logout {
	async handle() {
		deleteConfig('username');
		deleteConfig('password');
		deleteConfig('email');
		deleteConfig('user_id');
		deleteConfig('name');

		console.log(chalk.green(`Logged out`));
	}
};
