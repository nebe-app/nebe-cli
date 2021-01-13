const Bundler = require('parcel-bundler');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const getFill = require('../utils/getFill');
const checkConfig = require('../utils/checkConfig');
const checkSchema = require('../utils/checkSchema');
const getDirectories = require('../utils/getDirectories');
const checkBrowsersList = require('../utils/checkBrowsersList');
const { getRoot, getLastDev, getConfig, setConfig, isSazka } = require('../utils/configGetters');
const Sentry = require('@sentry/node');
const tcpPortUsed = require('tcp-port-used');
const notifier = require('node-notifier');
const express = require('express');
const simpleGit = require('simple-git');
const rimraf = require('rimraf');

module.exports = class Dev {
	constructor() {
		this.keepRunning = true;

		const [, , ...args] = process.argv;
		this.debug = args && args.join(' ').indexOf('--debug') !== -1;
		this.newest = args && args.join(' ').indexOf('--newest') !== -1;
		this.latest = args && args.join(' ').indexOf('--latest') !== -1;

		this.local = args && args.join(' ').indexOf('--local') !== -1;
	}

	async handle() {
		await checkBrowsersList();

		// Check port

		const basePort = isSazka() ? 1300 : 1200;
		const portsToCheck = [basePort, 1400];
		for (let i in portsToCheck) {
			if (portsToCheck.hasOwnProperty(i) === false) {
				continue;
			}
			i = parseInt(i);
			try {
				const inUse = await tcpPortUsed.check(portsToCheck[i], '127.0.0.1');
				if (inUse) {
					console.error(chalk.red(`🛑 Port ${portsToCheck[i]} není dostupný, pravděpodobně již běží jiná instance NEBE dev stacku!`));
					notifier.notify({
						title: 'Nelze spustit devstack',
						message: `🛑 Port ${portsToCheck[i]} není dostupný, pravděpodobně již běží jiná instance NEBE dev stacku!`,
						sound: true,
						icon: path.join(__dirname, '../assets/logo.png')
					});
					process.exit();
				}
			} catch (error) {
				console.log(chalk.yellow(`Chyba při zjišťování, zda je port ${portsToCheck[i]} dostupný, pokračuji`));
				console.log(error.message);
			}
		}

		// Prepare folder

		const root = getRoot();
		const bundlerFolder = path.join(root);

		await prepareFolder();

		let visualPath;

		if (this.newest && getConfig('newestVisual')) {
			visualPath = getConfig('newestVisual');
		} else if (this.latest) {
			visualPath = await getLastVisual();
		} else {
			visualPath = await detectLastVisual();
		}
		if (!visualPath) {
			visualPath = await selectVisual();
		}

		console.log(`Building ${visualPath}`);
		setConfig('lastDev', visualPath);
		fs.removeSync(path.join(bundlerFolder, 'dist'));

		// Git

		const git = simpleGit();
		await git.cwd(`${root}/src/${visualPath}`);
		const gitStatus = await git.status();

		/*
		State
		 */
		let state = {
			gitStatus,
			visualPath
		};

		/*
		 * Server
		 */
		const app = express();
		app.get('/state', (request, response) => {
			response.set('Access-Control-Allow-Origin', '*');
			response.send(state);
		});
		app.listen(1400);

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
		state.config = fs.readJsonSync(configPath);

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
		await checkSchema(schemaPath, state);
		let fill = getFill(schemaPath);

		/**
		 * VisualSizes
		 */
		const folders = glob.sync(`${root}/src/${visualPath}/[!_][0-9]*/index.html`);

		if (folders.length === 0) {
			console.error('🛑 Kreativa neobsahuje žádné rozměry! Začněte zkopírováním existující kreativy, pokud existují, nebo si stáhněte šablonu z https://github.com/nebe-app');
			notifier.notify({
				title: 'Nelze spustit devstack',
				message: `🛑 Kreativa neobsahuje žádné rozměry! Začněte zkopírováním existující kreativy nebo si stáhněte šablonu`,
				sound: true,
				icon: path.join(__dirname, '../assets/logo.png')
			});
			process.exit();
		}

		console.log(`Serving ${folders.length} visual sizes`);

		state.folders = folders;

		// Fetch visual info

		try {
			state.visual = {};
		} catch (error) {
			console.error();
		}

		let bundlers = [];

		rimraf.sync(bundlerFolder + '/.cache');
		//await fs.promises.mkdir(bundlerFolder + '/.cache');


		// Select resizes
		const folderChoices = {
			type: 'checkbox',
			name: 'folders',
			message: 'Select resizes',
			choices: folders.map(folder => {
				return {
					name: folder.toString()
						.replace(`${root}/src/${visualPath}/`, '')
						.replace('/index.html', ''),
					checked: true
				};
			})
		};
		const folderAnswers = await inquirer.prompt(folderChoices);
		const selectedFolders = folderAnswers.folders;

		if (selectedFolders.length === 0) {
			console.error('🛑 Nevybrány žádné rozměry');
			notifier.notify({
				title: 'Nelze spustit devstack',
				message: `🛑 Nevybrány žádné rozměry`,
				sound: true,
				icon: path.join(__dirname, '../assets/logo.png')
			});
			process.exit();
		}

		console.log(`Running bundlers for resizes: ${selectedFolders}`);

		state.bundlers = {};

		for (let i in selectedFolders) {
			if (selectedFolders.hasOwnProperty(i) === false) {
				continue;
			}

			state.bundlers[i] = {};

			const entryPoint = `${root}/src/${visualPath}/${selectedFolders[i]}/index.html`;
			const folder = selectedFolders[i];

			state.bundlers[i].folder = folder;

			try {
				const options = {
					outDir: `${bundlerFolder}/dist/${folder}`,
					outFile: 'index.html',
					publicUrl: '/',
					watch: true,
					cache: false,
					//cacheDir: bundlerFolder + '/.cache/' + i,
					minify: true,
					logLevel: 2,
					autoInstall: true,

					contentHash: false,
					global: 'VISUAL',
					scopeHoist: false,
					target: 'browser',
					bundleNodeModules: false,
					hmr: true,
					sourceMaps: true,
					detailedReport: true
				};
				const bundler = new Bundler(entryPoint, options);
				const port = parseInt(basePort) + parseInt(i);

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
					const visualClientScript = `<script src="https://cdn.nebe.app/store/serving/dist/visual-client.min.js"></script>`;

					let markupContents = fs.readFileSync(`${bundlerFolder}/dist/${folder}/index.html`).toString();

					markupContents = markupContents
						.replace(/<!--NEBE_POLYFILLS-->.+<!--\/NEBE_POLYFILLS-->/gms, '')
						.replace(`</head>`, `\n<!--NEBE_POLYFILLS--><script src="https://cdnjs.cloudflare.com/ajax/libs/promise-polyfill/8.1.3/polyfill.min.js"></script><script src="https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.7/runtime.min.js"></script><!--/NEBE_POLYFILLS-->\n</head>`);

					markupContents = markupContents
						.replace(/<!--NEBE_DEMO_FILL-->.+<!--\/NEBE_DEMO_FILL-->/gms, '')
						.replace(`</body>`, `\n<!--NEBE_DEMO_FILL-->\n${fill}\n<!--/NEBE_DEMO_FILL-->\n</body>`)
						.replace(/<!--NEBE_VISUAL_CLIENT-->.+<!--\/NEBE_VISUAL_CLIENT-->/g, '')
						.replace(`</head>`, `\n<!--NEBE_VISUAL_CLIENT-->\n${visualClientScript}\n<!--/NEBE_VISUAL_CLIENT-->\n</head>`);

					markupContents = markupContents
						.replace(/<!--NEBE_ENV-->.+<!--\/NEBE_ENV-->/gms, '')
						.replace(`</head>`, `\n<!--NEBE_ENV-->\n<script>window.MODE = 'dev'; window.FOLDER = '${folder}';</script>\n<!--/NEBE_ENV-->\n</head>`);

					markupContents = markupContents
						.replace(/<!--NEBE_DOCUMENT_TITLE-->.+<!--\/NEBE_DOCUMENT_TITLE-->/gms, '')
						.replace(`</head>`, `\n<!--NEBE_DOCUMENT_TITLE-->\n<script>document.title = "${folder} ${visualPath}";</script>\n<!--/NEBE_DOCUMENT_TITLE-->\n</head>`);

					// Client

					const visualClientUrl = this.local
						? 'http://localhost:1236/'
						: 'https://cdn.nebe.app/store/serving/dist/';

					if (this.debug) {
						console.log(`Using VisualClient on URL ${visualClientUrl}`);
					}

					markupContents = markupContents
						.replace(/<!--NEBE_VISUAL_CLIENT-->.+<!--\/NEBE_VISUAL_CLIENT-->/gms, '')
						.replace(`</head>`, `\n<!--NEBE_VISUAL_CLIENT-->\n<script src="${visualClientUrl}visual-client.min.js"></script>\n<!--/NEBE_VISUAL_CLIENT-->\n</head>`);

					// Helper

					const visualHelperUrl = this.local
						? 'http://localhost:1235/'
						: 'https://cdn.nebe.app/store/utils/dist/';

					if (this.debug) {
						console.log(`Using VisualHelper on URL ${visualHelperUrl}`);
					}

					markupContents = markupContents
						.replace(/<!--NEBE_VISUAL_HELPER-->.+<!--\/NEBE_VISUAL_HELPER-->/gms, '')
						.replace(`</head>`, `\n<!--NEBE_VISUAL_HELPER-->\n<link rel="stylesheet" href="${visualHelperUrl}visual-helper.min.css" type="text/css">\n<script src="${visualHelperUrl}visual-helper.min.js"></script>\n<!--/NEBE_VISUAL_HELPER-->\n</head>`);

					// Write it

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
				console.log(`${parseInt(i) + 1}/${selectedFolders.length} Serving ${folder} on http://localhost:${port}`);
				bundlers.push(bundler);

				state.bundlers[i].error = false;
				state.bundlers[i].port = port;

			} catch (error) {
				Sentry.captureException(error);
				console.error(`${parseInt(i) + 1}/${folders.length} Error ${folder}`);

				state.bundlers[i].error = false;
			}
		}

		console.log('Listening to file changes... Press Ctrl+C to stop servers');

		if (fs.existsSync(schemaPath)) {
			fs.watch(schemaPath, {}, async () => {
				console.log('Schema changed, checking and rebundling...');
				setTimeout(async () => {
					await checkSchema(schemaPath, state);
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

const getLastVisual = async function() {
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

	if (!visualExists) {
		return null;
	}

	return lastDev;
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
