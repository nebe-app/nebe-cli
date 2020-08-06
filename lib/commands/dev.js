const Bundler = require('parcel-bundler');
const fs = require('fs-extra');
const os = require('os');
const glob = require('glob');
const path = require('path');
const inquirer = require('inquirer');
const getFill = require('../utils/getFill');
const config = require('../utils/config');
const getDirectories = require('../utils/getDirectories');

module.exports = class Dev {
	constructor() {
		this.keepRunning = true;
	}

	help() {
		return `Developing visual`;
	}

	async handle() {
		const root = config.get('root');
		const lastDev = config.get('lastDev');
		const bundlerFolder = path.join(root);

		try {
			await fs.promises.mkdir(bundlerFolder);
		} catch (error) {
		}

		process.chdir(bundlerFolder);

		let visualPath = null;

		if (lastDev) {
			let visualExists = false;
			try {
				const stats = await fs.promises.lstat(path.join(root, 'src', lastDev));
				visualExists = stats.isDirectory();
			} catch (error) {
			}

			const lastVisualContent = lastDev;

			if (visualExists) {
				const lastVisualAnswers = await inquirer.prompt({
					type: 'list',
					name: 'first',
					message: 'Use last visual? ' + lastVisualContent,
					choices: [
						'Ano',
						'Ne'
					]
				});

				visualPath = lastVisualAnswers.first === 'Ano' ? lastVisualContent : null;
			}
		}

		if (!visualPath) {
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

			visualPath = `${selectedBrand}/${selectedVisual}`;
		}

		console.log(`Building ${visualPath}`);

		config.set('lastDev', visualPath);

		fs.removeSync(path.join(bundlerFolder, 'dist'));

		/**
		 * Configs
		 */
		const configs = glob.sync(`${root}/src/${visualPath}/config.*`);

		for (let i = 0; i < configs.length; i++) {
			const path = configs[i];
			const relativePath = path.toString().replace(`${root}/src/${visualPath}/`, '');
			fs.copySync(path, `${bundlerFolder}/dist/${relativePath}`);
		}

		console.log(`Copied ${configs.length} configs`);

		/**
		 * Include folders
		 */
		const includes = glob.sync(`${root}/src/${visualPath}/include/`);

		for (let i = 0; i < includes.length; i++) {
			const path = includes[i];
			const relativePath = path.toString().replace(`${root}/src/${visualPath}/`, '');
			fs.copySync(path, `${bundlerFolder}/dist/${relativePath}`);
		}

		console.log(`Copied ${includes.length} include folders`);

		const schemaPath = `${root}/src/${visualPath}/schema.json`;

		let fill = getFill(schemaPath);
		fill += `<script>
		if (typeof window.SWITCH_DEVELOPMENT === 'undefined') {
			window.SWITCH_DEVELOPMENT = (event) => {
				if (event.key.toLowerCase() === 'd') {
					console.log('Switching development mode');
					window.DEVEL = !window.DEVEL;
					document.querySelector('html').classList.toggle('is-development', window.DEVEL);
				}};
			document.addEventListener('keydown', window.SWITCH_DEVELOPMENT);
		}
	</script>`;

		/**
		 * VisualSizes
		 */
		const folders = glob.sync(`${root}/src/${visualPath}/[!_][0-9]*/index.html`);

		console.log(`Serving ${folders.length} visual sizes`);

		let bundlers = [];

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
					cacheDir: bundlerFolder + '/.cache',
					minify: true,
					logLevel: 2,
					autoInstall: true,

					contentHash: false,
					global: 'VISUAL',
					scopeHoist: false,
					target: 'browser',
					bundleNodeModules: false,
					hmr: false,
					sourceMaps: false,
					detailedReport: false
				};
				const bundler = new Bundler(entryPoint, options);
				const port = 1200 + i;
				let isFirstBundle = true;

				bundler.on('bundled', (bundle) => {
					let markupContents = fs.readFileSync(`${bundlerFolder}/dist/${folder}/index.html`).toString();
					markupContents = markupContents
						.replace(/<!--NEBE_DEMO_FILL-->.+<!--\/NEBE_DEMO_FILL-->/gms, '')
						.replace(`</body>`, `\n<!--NEBE_DEMO_FILL-->\n${fill}\n<!--/NEBE_DEMO_FILL-->\n</body>`);
					fs.writeFileSync(`${bundlerFolder}/dist/${folder}/index.html`, markupContents);

					if (isFirstBundle) {
						isFirstBundle = false;
					} else {
						console.log(`Bundled ${folder} on http://localhost:${port}`);
					}
				});

				await bundler.serve(port);
				console.log(`${i + 1}/${folders.length} Serving ${folder} on http://localhost:${port}`);

				bundlers.push(bundler);

			} catch (e) {
				console.error(`${i + 1}/${folders.length} Error ${folder}`);
			}
		}

		console.log('Listening to file changes... Press Ctrl+C to stop servers');

		if (fs.existsSync(schemaPath)) {
			fs.watch(schemaPath, {}, () => {
				console.log('Schema changed, rebundling...');
				fill = getFill(schemaPath);
				bundlers.forEach(bundler => bundler.bundle());
			});
		}
	}
};
