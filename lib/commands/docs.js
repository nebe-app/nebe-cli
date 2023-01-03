const open = require('open');
const chalk = require('chalk');

module.exports = class Docs {
	help() {
		return `Opens browser with documentation`;
	}

	async handle() {
		const url = 'https://www.imagelance.com/docs';
		console.log(chalk.blue(`Opening browser with documentation ${url}`));
		await open(url);
	}
};
