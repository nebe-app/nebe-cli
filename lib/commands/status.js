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

				const visualFiles = await fs.promises.readdir(visualPath, { withFileTypes: true });

				if (visualFiles.length === 0) {
					table.push([path.join(brand, visual), `Empty folder, deleting`]);
					tableContainsRows = true;
					await fs.promises.rmdir(visualPath);
					continue;
				}

				if (!fs.existsSync(path.join(visualPath, '.git'))) {
					table.push([path.join(brand, visual), `Git not initialized`]);
					tableContainsRows = true;
					continue;
				}

				if (fs.existsSync(path.join(visualPath, 'config.json'))) {
					const config = JSON.parse(fs.readFileSync(path.join(visualPath, 'config.json')));
					if (!config.format) {
						console.error('no config format ' + visualPath);
					}
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

					//console.log(commitCount);
					continue;

					const status = await git.status();

					if (status.tracking === null) {
						await git.branch('master', {'--set-upstream-to': 'origin/master'});
						console.log(`No tracking: ` + visualPath);
					}

					if (status.current === 'No') {
						console.log(`Not master: ` + visualPath + ' ' + status.current);
					}

					if (status.current !== 'master') {
						console.log(`Not master: ` + visualPath + ' ' + status.current);
					}

					//console.log(status);
					if (status.files.length) {
					//	console.log(visualPath + ' ' + status.files.length);
					}

				} catch (error) {
					console.log(visualPath);
					//console.log(error);
				}
			}

			if (tableContainsRows) {
				console.log(table.toString());
			}
		}
	}
};

