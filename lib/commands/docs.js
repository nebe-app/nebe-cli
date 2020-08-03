const opn = require('opn');
const chalk = require('chalk');

module.exports = class Docs {
	help() {
		return `Opens browser with documentation`;
	}

	async handle() {
		const url = 'https://www.nebe.app/docs';
		console.log(chalk.blue(`Opening browser with documentation ${url}`));
		await opn(url);
	}
};
