const chalk = require('chalk');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const apiUrl = require('../utils/apiUrl');
const {getRoot, getUsername, getPassword, setConfig} = require('../utils/configGetters');
const selectBrand = require('../utils/selectBrand');

module.exports = class Sync {
	async handle() {
		const selectedBrand = await selectBrand();

		const root = getRoot();
		const username = getUsername();
		const password = getPassword();

		let response;

		try {
			response = await axios.get(apiUrl('visual'), {
				auth: { username, password }
			});
			setConfig('lastSyncResponseData', response.data);
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

			if (brand !== selectedBrand) {
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

			const visuals = response.data.brands[brand];
			const reversedVisualKeys = Object.keys(visuals).reverse();

			for (let i in reversedVisualKeys) {
				let visual = reversedVisualKeys[i];
				if (!visuals.hasOwnProperty(visual)) {
					continue;
				}

				console.log(chalk.cyan(visual));

				const visualData = visuals[visual];

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
					//await git.pull();
					console.log(chalk.green('Repository successfully fetched'));
				} catch (error) {
					console.error(error);
				}
			}
		}

		const now = new Date();
		setConfig('lastSync', now.toISOString());
	}
};
