const config = require('../utils/config');
const fs = require('fs');
const chalk = require('chalk');
const { execSync } = require('child_process');

module.exports = class SetRoot {
	help() {
		return `Go to  root directory`;
	}

	async handle() {
		const root = config.get('root');

		if (!root) {
			console.error(chalk.red(`Root is not set`));
			return false;
		}

		const stats = fs.lstatSync(root);

		if (!stats.isDirectory()) {
			console.error(chalk.red(`Root is not set`));
			return false;
		}

		console.error(chalk.green(`Going to ${root}`));

		execSync('cd ' + root);
		return true;
	}
};
