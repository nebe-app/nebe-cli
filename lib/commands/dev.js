const Bundler = require('parcel-bundler');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const getFill = require('../utils/getFill');
const appendDevelSwitcher = require('../utils/appendDevelSwitcher');
const checkConfig = require('../utils/checkConfig');
const checkSchema = require('../utils/checkSchema');
const getDirectories = require('../utils/getDirectories');
const checkBrowsersList = require('../utils/checkBrowsersList');
const {parse, stringify} = require('flatted');
const {getRoot, getLastDev, setConfig} = require('../utils/configGetters');
const Sentry = require('@sentry/node');

module.exports = class Dev {
	constructor() {
		this.keepRunning = true;

		const [, , ...args] = process.argv;
		this.debug = args && args.join(' ').indexOf('--debug') !== -1;
	}

	async handle() {
		await checkBrowsersList();

		const root = getRoot();
		const bundlerFolder = path.join(root);

		await prepareFolder();

		let visualPath = await detectLastVisual();

		if (!visualPath) {
			visualPath = await selectVisual();
		}

		console.log(`Building ${visualPath}`);
		setConfig('lastDev', visualPath);
		fs.removeSync(path.join(bundlerFolder, 'dist'));

		/**
		 * Config
		 */
		const configPath = `${root}/src/${visualPath}/config.json`;
		const configResult = await checkConfig(configPath);
		if (!configResult) {
			process.exit(1);
		}
		const destConfigPath = `${bundlerFolder}/dist/${visualPath}/config.json`;
		fs.copySync(configPath, destConfigPath);

		/**
		 * Include folders
		 */
		const includes = glob.sync(`${root}/src/${visualPath}/include/`);
		for (let i = 0; i < includes.length; i++) {
			const path = includes[i];
			const relativePath = path.toString().replace(`${root}/src/${visualPath}/`, '');
			fs.copySync(path, `${bundlerFolder}/dist/${relativePath}`);
		}

		/**
		 * Get fill
		 */
		const schemaPath = `${root}/src/${visualPath}/schema.json`;
		await checkSchema(schemaPath);
		let fill = getFill(schemaPath);
		fill = appendDevelSwitcher(fill);

		/**
		 * VisualSizes
		 */
		const folders = glob.sync(`${root}/src/${visualPath}/[!_][0-9]*/index.html`);

		console.log(`Serving ${folders.length} visual sizes`);

		let bundlers = [];

		try {
			await fs.promises.mkdir(bundlerFolder + '/.cache');
		} catch (error) {
		}

		for (let i = 0; i < folders.length; i++) {
			const entryPoint = folders[i];
			const folder = entryPoint.toString()
				.replace(`${root}/src/${visualPath}/`, '')
				.replace('/index.html', '');

			try {
				const options = {
					outDir: `${bundlerFolder}/dist/${folder}`,
					outFile: 'index.html',
					publicUrl: '/',
					watch: true,
					cache: true,
					cacheDir: bundlerFolder + '/.cache/' + i,
					minify: true,
					logLevel: 2,
					autoInstall: true,

					contentHash: false,
					global: 'VISUAL',
					scopeHoist: false,
					target: 'browser',
					bundleNodeModules: false,
					hmr: true,
					sourceMaps: false,
					detailedReport: true
				};
				const bundler = new Bundler(entryPoint, options);
				const port = 1200 + i;
				let isFirstBundle = true;

				bundler.on('buildStart', (entryPoints) => {
					if (this.debug) {
						console.log(`${folder} buildStart ${JSON.stringify(entryPoints)}`);
					}
				});

				bundler.on('buildError', (error) => {
					console.log(`${folder} buildError`);
					console.error(error);
				});

				bundler.on('buildEnd', () => {
					if (this.debug) {
						console.log(`${folder} buildEnd`);
					}
				});

				bundler.on('bundled', (bundle) => {
					if (this.debug) {
						console.log(bundle.childBundles);
					}

					let markupContents = fs.readFileSync(`${bundlerFolder}/dist/${folder}/index.html`).toString();
					markupContents = markupContents
						.replace(/<!--NEBE_DEMO_FILL-->.+<!--\/NEBE_DEMO_FILL-->/gms, '')
						.replace(`</body>`, `\n<!--NEBE_DEMO_FILL-->\n${fill}\n<!--/NEBE_DEMO_FILL-->\n</body>`);

					fs.writeFileSync(`${bundlerFolder}/dist/${folder}/index.html`, markupContents);

					if (markupContents.indexOf('<main>') === -1 && markupContents.indexOf('<main ') === -1) {
						console.error(chalk.red(`Resize ${folder} does not contain element <main>!`));
					}

					if (isFirstBundle) {
						isFirstBundle = false;
					} else {
						console.log(`Bundled ${folder} on http://localhost:${port}`);
					}
				});

				await bundler.serve(port);
				console.log(`${i + 1}/${folders.length} Serving ${folder} on http://localhost:${port}`);
				bundlers.push(bundler);

			} catch (error) {
				Sentry.captureException(error);
				console.error(`${i + 1}/${folders.length} Error ${folder}`);
			}
		}

		console.log('Listening to file changes... Press Ctrl+C to stop servers');

		if (fs.existsSync(schemaPath)) {
			fs.watch(schemaPath, {}, async () => {
				console.log('Schema changed, checking and rebundling...');
				setTimeout(async () => {
					await checkSchema(schemaPath);
					fill = getFill(schemaPath);
					bundlers.forEach(bundler => bundler.bundle());
				}, 200);
			});
		}

		fs.watch(configPath, {}, async () => {
			console.log('Config changed, validating');
			await checkConfig(configPath);
		});
	}
};

const prepareFolder = async function() {
	const root = getRoot();
	const bundlerFolder = path.join(root);

	try {
		await fs.promises.mkdir(bundlerFolder);
	} catch (error) {
	}

	process.chdir(bundlerFolder);
};

const detectLastVisual = async function() {
	const root = getRoot();
	const lastDev = getLastDev();

	if (!lastDev) {
		return null;
	}

	let visualExists = false;
	try {
		const stats = await fs.promises.lstat(path.join(root, 'src', lastDev));
		visualExists = stats.isDirectory();
	} catch (error) {
	}

	const lastVisualContent = lastDev;

	if (!visualExists) {
		return null;
	}
	const lastVisualAnswers = await inquirer.prompt({
		type: 'list',
		name: 'first',
		message: 'Use last visual? ' + lastVisualContent,
		choices: [
			'Ano',
			'Ne'
		]
	});

	return lastVisualAnswers.first === 'Ano' ? lastVisualContent : null;
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
