const chalk = require('chalk');

module.exports = class Ping {
	async handle() {
		console.log(chalk.blue(`Pong`));
	}
};
