const config = require('../utils/config');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const getDirectories = require('../utils/getDirectories');
const Table = require('cli-table');

module.exports = class Status {
	help() {
		return `Status of gits`;
	}

	async handle() {
		const root = config.get('root');

		const git = simpleGit();

		const brandFolders = await getDirectories(path.join(root, 'src'));

		const brands = brandFolders.filter((folder) => {
			return folder[0] !== '.';
		});

		for (let brandIndex in brands) {
			if (!brands.hasOwnProperty(brandIndex)) {
				continue;
			}

			const brand = brands[brandIndex];
			const visualFolders = await getDirectories(path.join(root, 'src', brand));

			const table = new Table({
				head: [brand, 'Message']
			});
			let tableContainsRows = false;

			const visuals = visualFolders.filter((folder) => {
				return folder[0] !== '.';
			});

			for (let visualIndex in visuals) {
				if (!visuals.hasOwnProperty(visualIndex)) {
					continue;
				}

				const visual = visuals[visualIndex];
				const visualPath = path.join(root, 'src', brand, visual);

				if (!fs.existsSync(path.join(visualPath, '.git'))) {
					table.push([path.join(brand, visual), `Git not initialized`]);
					tableContainsRows = true;
					continue;
				}

				try {
					await git.cwd(visualPath);
					const status = await git.status();



					if (status.not_added.length || status.staged.length || status.created.length || status.deleted.length || status.modified.length) {

						console.log(status);

						await git.add('./*');
						await git.commit('Transfer from nebe-isobar-banners');
						await git.push('origin', 'master');
					}

				} catch (error) {
					//visualPath
					//console.error(error);
					//process.exit();
				}
			}

			if (tableContainsRows) {
				console.log(table.toString());
			}
		}
	}
};

