const getDirectories = require('./getDirectories');
const {getRoot} = require('./configGetters');
const inquirer = require('inquirer');
const path = require('path');

module.exports = async function () {
	const root = getRoot();

	const brandFolders = await getDirectories(path.join(root, 'src'));
	const brands = brandFolders.filter((folder) => {
		return folder[0] !== '.';
	});

	if (!brands.length) {
		console.error('No brands');
		process.exit();
	}

	let selectedBrand;

	if (brands.length === 1) {
		selectedBrand = brands[0];
	} else {
		const brandChoices = {
			type: 'list',
			name: 'first',
			message: 'Select brand',
			choices: brands.map(brandPath => brandPath.toString()
				.replace(`${root}/src/`, ''))
		};

		const brandAnswers = await inquirer.prompt(brandChoices);
		selectedBrand = brandAnswers.first;
	}

	return selectedBrand;
}
