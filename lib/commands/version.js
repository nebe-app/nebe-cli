const pkg = require('../../package.json');
const chalk = require('chalk');

module.exports = class Version {
	async handle() {
		console.log(chalk.yellow(`${pkg.version}`));
	}
};
