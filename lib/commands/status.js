const config = require('../utils/config');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const getDirectories = require('../utils/getDirectories');
const Table = require('cli-table');
const {getRoot} = require('../utils/configGetters');

module.exports = class Status {
	async handle() {
		const root = getRoot();

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

					if (status.files.length) {
						console.log(visualPath + ' ' + status.files.length);
					}

				} catch (error) {
					console.log(error);
				}
			}

			if (tableContainsRows) {
				console.log(table.toString());
			}
		}
	}
};

