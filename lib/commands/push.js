const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const getDirectories = require('../utils/getDirectories');
const Table = require('cli-table');
const {getRoot} = require('../utils/configGetters');

module.exports = class Fetch {
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
					continue;
				}

				try {
					await git.cwd(visualPath);
					const status = await git.status();

					if (status.files.length) {
						console.log(`Pushing ${visualPath}`);
						await git.add('./*');
						await git.commit('Transfer from nebe-isobar-banners');
						await git.push('origin', 'master');
					}

				} catch (error) {
					tableContainsRows = true;
					table.push([path.join(brand, visual), error.toString()]);
				}
			}

			if (tableContainsRows) {
				console.log(table.toString());
			}
		}
	}
};

