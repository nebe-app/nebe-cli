const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const getDirectories = require('../utils/getDirectories');
const Table = require('cli-table');
const {getRoot} = require('../utils/configGetters');

module.exports = class Commit {
	async handle() {
		const root = getRoot();

		const git = simpleGit();

		const brandFolders = await getDirectories(path.join(root, 'src'));

		const brands = brandFolders.filter((folder) => {
			return folder[0] !== '.';
		});

		const table = new Table({
			head: ['Organization', 'Visual', 'Status']
		});

		let tableContainsRows = false;

		for (let brandIndex in brands) {
			if (!brands.hasOwnProperty(brandIndex)) {
				continue;
			}

			const brand = brands[brandIndex];
			const visualFolders = await getDirectories(path.join(root, 'src', brand));

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
						const fileNames = status.files.map(file => file.path).join(', ');

						table.push([brand, visual, 'Změněných souborů: ' + status.files.length + ' - ' + fileNames]);
						tableContainsRows = true;

						await git.add('./*');
						await git.commit('Changed files: ' + fileNames);
						await git.push('origin', 'master');
					}

				} catch (error) {
					table.push([brand, visual, 'Error: ' + error.toString()]);
					tableContainsRows = true;
				}
			}
		}

		if (tableContainsRows) {
			console.log(table.toString());
		} else {
			console.log(`Nothing to commit/push`);
		}
	}
};

