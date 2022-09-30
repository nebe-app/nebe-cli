const path = require('path');
const chalk = require('chalk');
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

		const table = new Table({
			head: ['Organization', 'Template', 'Status']
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

				const visualFiles = await fs.promises.readdir(visualPath, { withFileTypes: true });

				if (visualFiles.length === 0) {
					table.push([brand, visual, `Empty folder, deleting`]);
					tableContainsRows = true;
					await fs.promises.rmdir(visualPath);
					continue;
				}

				if (!fs.existsSync(path.join(visualPath, '.git'))) {
					table.push([brand, visual, `Git not initialized`]);
					tableContainsRows = true;
					continue;
				}

				try {
					await git.cwd(visualPath);

					try {
						const commitCount = parseInt(await git.raw('rev-list', '--count', 'master'));
					} catch (error) {
						await git.add('./*');
						await git.commit('Init commit');
						await git.push('origin', 'master');
						console.log('PUSH' + visualPath);
					}

					const status = await git.status();

					if (status.tracking === null) {
						await git.branch('master', {'--set-upstream-to': 'origin/master'});
						console.log(`No tracking: ` + visualPath);
					}

					if (status.current === 'No') {
						console.log(`Not master: ` + visualPath + ' ' + status.current);
					}

					if (status.current !== 'master') {
						console.log(chalk.cyan(`Not master: ` + visualPath + ' ' + status.current));
					}

					if (status.files.length) {
						const fileNames = status.files.map(file => file.path).join(', ');

						table.push([brand, visual, 'Changed files: ' + status.files.length + ' - ' + fileNames]);
						tableContainsRows = true;
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
			console.log(`No changes`);
		}
	}
};

