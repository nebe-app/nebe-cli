const config = require('../utils/config');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const simpleGit = require('simple-git');

module.exports = class Test {
	help() {
		return `Test settings`;
	}

	async handle() {
		const root = config.get('root');

		if (!root) {
			console.error(chalk.red(`Root directory is not set!`));
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

		const url = `http://localhost/nebe/api/public/cli/visual`;
		const response = await axios.get(url, {
			auth: { username, password }
		});

		const git = simpleGit();

		for (let brand in response.data.brands) {
			if (!response.data.brands.hasOwnProperty(brand)) {
				continue;
			}

			const brandPath = `${root}/${brand}`;

			try {
				const stats = fs.lstatSync(brandPath);

				if (!stats.isDirectory()) {
					throw new Error('Not directory');
				}
			} catch (error) {
				fs.mkdirSync(brandPath);
				console.log(`Creating directory ${brandPath}`);
			}

			for (let visual in response.data.brands[brand]) {
				if (!response.data.brands[brand].hasOwnProperty(visual)) {
					continue;
				}

				const repoPath = `${root}/${brand}/${visual}`;

				try {
					const stats = fs.lstatSync(repoPath);

					if (!stats.isDirectory()) {
						throw new Error('Not directory');
					}
				} catch (error) {
					fs.mkdirSync(repoPath);
					console.log(`Creating repo directory ${repoPath}`);
				}

				await git.cwd(repoPath);

				try {
					const status = await git.status();
					//console.log(status);

					if (status.not_added.length || status.staged.length || status.created.length) {
						await git.add('./*');
						await git.commit("Init commit");
						await git.push('origin', 'master');
						console.log(visual);
					}



				} catch (error) {
					const repoUrl = `https://${username}:${password}@git.nebe.app/${brand}/${visual}.git`;
					await git.clone(repoUrl, '.');
					//process.exit();
				}

			}
		}
	}
};
