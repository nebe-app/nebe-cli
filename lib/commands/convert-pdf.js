const Pdf2pic = require('pdf2pic');
const fs = require('fs-extra');
const glob = require('glob');
const inquirer = require('inquirer');
const config = require('../utils/config');
const path = require('path');
const getDirectories = require('../utils/getDirectories');
const {getRoot} = require('../utils/configGetters');

module.exports = class ConvertPdf {
	async handle() {
		const visualPath = await selectVisual();

		const root = getRoot();
		const pdfs = glob.sync(`${root}/src/${visualPath}/[!_][0-9]*/*.pdf`);

		console.log(`Converting ${pdfs.length} pdfs`);

		for (let i = 0; i < pdfs.length; i++) {
			const pdf = pdfs[i];
			const fileName = pdf.toString()
				.replace(`${root}/src/${visualPath}/`, '');

			const parts1 = fileName.split('mm'); // @variant
			const parts3 = parts1[1].split('/');
			const filenameWithExtension = parts3[1];
			const parts2 = parts1[0].split('x');

			const filename = filenameWithExtension.replace('.pdf', '');
			const width = parts2[0];
			const height = parts2[1];

			const dpi = 300;
			const pixelWidth = Math.round(width * dpi / 25.4);
			const pixelHeight = 5000;//Math.round(height * dpi / 25.4);
			const size = `${pixelWidth}x${pixelHeight}`;

			const savedir = `${root}/src/${visualPath}/${width}x${height}mm${parts3[0]}`;

			const pdf2pic = new Pdf2pic({
				density: dpi,
				savedir,
				savename: filename,
				format: `jpg`,
				size
			});

			console.log(`${savedir}/${filename}.pdf`);
			await pdf2pic.convert(`${savedir}/${filename}.pdf`);
			await fs.promises.rename(`${savedir}/${filename}_1.jpg`, `${savedir}/${filename}.jpg`);
		}
	}
};

const selectVisual = async function() {
	const root = getRoot();

	const brandFolders = await getDirectories(path.join(root, 'src'));
	const brands = brandFolders.filter((folder) => {
		return folder[0] !== '.';
	});

	if (!brands.length) {
		console.error('No brands');
		process.exit();
	}

	let selectedBrand = null;

	if (brands.length === 1) {
		selectedBrand = brands[0];
	} else {
		const brandChoices = {
			type: 'list',
			name: 'first',
			message: 'Select brand',
			choices: brands.map(brandPath => brandPath.toString()
				.replace(`${root}/src/`, '')
				.replace('/brand.json', ''))
		};

		const brandAnswers = await inquirer.prompt(brandChoices);
		selectedBrand = brandAnswers.first;

		console.log(selectedBrand);
	}

	// Visual

	const visualFolders = await getDirectories(path.join(root, 'src', selectedBrand));
	const visuals = visualFolders.filter((folder) => {
		return folder[0] !== '.';
	});

	if (!visuals.length) {
		console.error('No visuals');
		process.exit();
	}

	visuals.reverse();

	const visualsChoices = {
		type: 'list',
		name: 'first',
		message: 'Select visual',
		choices: visuals.map(visualPath => visualPath
			.toString()
			.replace(`${root}/src/${selectedBrand}/`, '')
			.replace(`/`, '')
		)
	};

	const visualAnswers = await inquirer.prompt(visualsChoices);
	const selectedVisual = visualAnswers.first;

	return `${selectedBrand}/${selectedVisual}`;
};

