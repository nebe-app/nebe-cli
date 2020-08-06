const chalk = require('chalk');

module.exports = class Ping {
	help() {
		return `Ping`;
	}

	async handle() {
		console.log(chalk.blue(`Pong`));
	}
};
