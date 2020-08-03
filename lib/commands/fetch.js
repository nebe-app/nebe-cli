const config = require('../utils/config');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const simpleGit = require('simple-git');
const apiUrl = require('../utils/apiUrl');

module.exports = class Fetch {
	help() {
		return `Fetch all visuals`;
	}

	async handle() {
		const root = config.get('root');
		const username = config.get('username');
		const password = config.get('password');

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
			}
		}
	}
};
