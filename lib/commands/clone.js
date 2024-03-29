const chalk = require('chalk');
const fs = require('fs');
const git = require('simple-git');
const {getRoot, getUsername, getPassword} = require('../utils/configGetters');

module.exports = class Clone {
	async handle(args) {
		if (!args || args.length !== 1) {
			console.error(chalk.red(`Invalid or missing name of template`));
			return false;
		}

		const repoName = args[0];

		if (repoName.indexOf('/') === -1) {
			console.error('Invalid repo name');
			return false;
		}

		const root = getRoot();
		const username = getUsername();
		const password = getPassword();

		const remote = `https://${username}:${password}@git.imagelance.com/${repoName}.git`;

		try {
			await fs.promises.mkdir(`${root}/src`);
		} catch (error) {
		}

		try {
			let stats = await fs.promises.lstat(`${root}/src/${repoName}`);
			let exists = /*(stats.isDirectory() && ) || */stats.isFile();

			if (exists) {
				console.error(chalk.red('Repository already cloned'));
				return false;
			}
		} catch (error) {
		}

		const brandFolder = repoName.split('/')[0];

		try {
			await fs.promises.mkdir(`${root}/src/${brandFolder}`);
			await fs.promises.mkdir(`${root}/src/${repoName}`);
		} catch (error) {
		}

		try {
			console.log('Starting cloning...');
			await git().clone(remote, `${root}/src/${repoName}`, {'--depth': '1'});
			console.log(chalk.green('Repository successfully cloned'));
		} catch (error) {
			console.error(error);
		}
	}
};
