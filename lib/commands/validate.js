const path = require('path');
const fs = require('fs');
const getDirectories = require('../utils/getDirectories');
const checkConfig = require('../utils/checkConfig');
const checkSchema = require('../utils/checkSchema');
const {getRoot} = require('../utils/configGetters');

module.exports = class Validate {
	async handle() {
		const root = getRoot();

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

			const visuals = visualFolders.filter((folder) => {
				return folder[0] !== '.';
			});

			for (let visualIndex in visuals) {
				if (!visuals.hasOwnProperty(visualIndex)) {
					continue;
				}

				const visual = visuals[visualIndex];
				const visualPath = path.join(root, 'src', brand, visual);

				const configPath = path.join(visualPath, 'config.json');
				if (fs.existsSync(configPath)) {
					console.log(`Checking config of ${brand}/${visual}`);
					await checkConfig(configPath)
				}

				const schemaPath = path.join(visualPath, 'schema.json');
				if (fs.existsSync(schemaPath)) {
					console.log(`Checking schema of ${brand}/${visual}`);
					await checkSchema(schemaPath)
				}
			}
		}

		console.log(`Done`);
	}
};

