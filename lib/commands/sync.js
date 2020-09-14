const config = require('../utils/config');
const chalk = require('chalk');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const apiUrl = require('../utils/apiUrl');
const {getRoot, getUsername, getPassword} = require('../utils/configGetters');

module.exports = class Sync {
	async handle() {
		const root = getRoot();
		const username = getUsername();
		const password = getPassword();

		let response;

		try {
			response = await axios.get(apiUrl('visual'), {
				auth: { username, password }
			});
		} catch (error) {
			console.log(error);
			console.error(chalk.red(error.message));
			return false;
		}

		const git = simpleGit();

		fs.writeFileSync(`${root}/.gitignore`, `*.url`);

		try {
			await fs.promises.mkdir(`${root}/src`);
		} catch (error) {
		}

		for (let brand in response.data.brands) {
			if (!response.data.brands.hasOwnProperty(brand)) {
				continue;
			}

			const brandPath = `${root}/src/${brand}`;

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

				const visualData = response.data.brands[brand][visual];

				if (visualData.output_category === 'source') {
					//console.log(`Skipping source visual ${visual}`);
					continue;
				}

				const repoPath = `${root}/src/${brand}/${visual}`;

				try {
					const stats = fs.lstatSync(repoPath);

					if (!stats.isDirectory()) {
						throw new Error('Not directory');
					}
				} catch (error) {
					fs.mkdirSync(repoPath);
					console.log(`Creating repo directory ${repoPath}`);
				}

				const files = fs.readdirSync(repoPath);

				if (files.length > 0) {
					try {
						await git.cwd(repoPath);
						await git.init();
						await git.addRemote('origin', visualData.origin);
						console.log(chalk.green('Repository successfully inited'));
					} catch (error) {
						//
					}
				} else if (!fs.existsSync(path.join(repoPath, '.git'))) {
					try {
						await git.clone(visualData.origin, repoPath, {});
						console.log(chalk.green('Repository successfully cloned'));
					} catch (error) {
						console.error(error);
					}
				}

				try {
					await git.cwd(repoPath);
					await git.fetch();
					await git.pull();
					console.log(chalk.green('Repository successfully fetched+pulled'));
				} catch (error) {
					console.error(error);
				}
			}
		}
	}
};
