const Pdf2pic = require('pdf2pic');
const fs = require('fs-extra');
const glob = require('glob');
const inquirer = require('inquirer');
const config = require('../utils/config');
const path = require('path');

module.exports = class ConvertPdf {
	help() {
		return `Convert pdf to jpg`;
	}

	async handle() {
		const root = config.get('root');
		//const brands = await fs.promises.(root)

		if (!brands.length) {
			console.error('No brands');
			process.exit();
		}

		const brandChoices = {
			type: 'list',
			name: 'first',
			message: 'Select brand',
			choices: brands.map(brandPath => brandPath.toString()
				.replace('src/', '')
				.replace('/brand.json', ''))
		};

		const brandAnswers = await inquirer.prompt(brandChoices);
		const selectedBrand = brandAnswers.first;

		// Category

		const categories = glob.sync(`src/${selectedBrand}/*/`);

		if (!categories.length) {
			console.error('No categories');
			process.exit();
		}

		const categoriesChoices = {
			type: 'list',
			name: 'first',
			message: 'Select category',
			choices: categories.map(categoryPath => categoryPath
				.toString()
				.replace(`src/${selectedBrand}/`, '')
				.replace(`/`, '')
			)
		};

		const categoryAnswers = await inquirer.prompt(categoriesChoices);
		const selectedCategory = categoryAnswers.first;

		// Visual

		const visuals = glob.sync(`src/${selectedBrand}/${selectedCategory}/*/`);

		if (!visuals.length) {
			console.error('No visuals');
			process.exit();
		}

		const visualsChoices = {
			type: 'list',
			name: 'first',
			message: 'Select visual',
			choices: visuals.map(visualPath => visualPath
				.toString()
				.replace(`src/${selectedBrand}/${selectedCategory}/`, '')
				.replace(`/`, '')
			)
		};

		const visualAnswers = await inquirer.prompt(visualsChoices);
		const selectedVisual = visualAnswers.first;

		const visualPath = `${selectedBrand}/${selectedCategory}/${selectedVisual}`;

		/**
		 * VisualSizes
		 */
		const pdfs = glob.sync(`src/${visualPath}/[!_][0-9]*/*.pdf`);

		console.log(`Converting ${pdfs.length} pdfs`);

		for (let i = 0; i < pdfs.length; i++) {
			const pdf = pdfs[i];
			const fileName = pdf.toString()
				.replace(`src/${visualPath}/`, '');

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

			const savedir = `${process.cwd()}/src/${visualPath}/${width}x${height}mm${parts3[0]}`;

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
