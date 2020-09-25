const inquirer = require('inquirer');
const chalk = require('chalk');
const axios = require('axios');
const apiUrl = require('../utils/apiUrl');
const fs = require('fs');
const simpleGit = require('simple-git');
const { getRoot, getUsername, getPassword } = require('../utils/configGetters');
const Sentry = require('@sentry/node');
const cliSpinners = require('cli-spinners');

module.exports = class Create {
	constructor() {
		const [, , ...args] = process.argv;
		this.debug = args && args.join(' ').indexOf('--debug') !== -1;
	}

	async handle() {
		const root = getRoot();
		const username = getUsername();
		const password = getPassword();

		let response;

		try {
			response = await axios.get(apiUrl('brand'), {
				auth: { username, password }
			});

			if (this.debug) {
				console.log(response.data);
			}
		} catch (error) {
			Sentry.captureException(error);
			console.log(error);
			console.error(chalk.red(error.message));
			return false;
		}

		const brands = response.data.brands;

		const brandAnswer = await inquirer.prompt({
			type: 'list',
			name: 'brand',
			message: 'Pro který brand založit kreativu?',
			choices: brands.map((brand) => {
				return {
					name: brand.name,
					value: brand.git_organization_name
				};
			})
		});

		const chosenBrand = brandAnswer.brand;

		const formatAnswer = await inquirer.prompt({
			type: 'list',
			name: 'format',
			message: 'V jakém výstupním formátu bude kreativa?',
			choices: [
				{ value: 'html', name: 'HTML5' },
				{ value: 'image', name: 'Obrázek (jpg, png)' },
				{ value: 'print', name: 'Tiskovina (pdf)' },
				{ value: 'video', name: 'Video (mp4, avi)' },
				{ value: 'audio', name: 'Audio (mp3, wav)' },
				{ value: 'fallback', name: 'Fallback (jpg)' }
			]
		});

		const chosenFormat = formatAnswer.format;

		/*const projectNameAnswer = await inquirer.prompt({
			type: 'input',
			name: 'projectName',
			message: `Interní číslo/identifikátor projektu (např. KLIENT_2020_05). Pokud ponecháte prázdné, nastaví se na rok a ID kreativy (např. 2020-0056). Slouží pro rozlišení mezi ostatními složkami pro vývojáře, není zobrazena ve webovém rozhraní.`
		});

		const projectName = projectNameAnswer.projectName;*/

		const nameAnswer = await inquirer.prompt({
			type: 'input',
			name: 'name',
			message: `Název kreativy. Veřejný, lze později změnit.`,
			validate: (input) => {
				return input && input.length > 3;
			}
		});

		const name = nameAnswer.name;

		const descriptionAnswer = await inquirer.prompt({
			type: 'input',
			name: 'description',
			message: `Popis kreativy (nepovinný)`
		});

		const description = descriptionAnswer.description;

		const tagsAnswer = await inquirer.prompt({
			type: 'input',
			name: 'tags',
			message: `Štítky kreativy (oddělujte čárkou, nepovinné)`
		});

		const tags = String(tagsAnswer.tags).split(',')
			.map((word) => {
				return word.trim();
			})
			.filter((word) => {
				return word.length > 0;
			});

		const payload = {
			git_organization_name: chosenBrand,
			output_category: chosenFormat,
			//project_name: projectName,
			name,
			description,
			tags
		};

		console.log(payload);

		const confirm = await inquirer.prompt({
			type: 'confirm',
			name: 'confirm',
			message: `Jsou data v pořádku?`,
			default: true
		});

		if (!confirm.confirm) {
			process.exit();
		}

		console.log(`Vytvářím kreativu...`);

		let createResponse;

		try {
			createResponse = await axios.request({
				method: 'POST',
				url: apiUrl('visual'),
				data: payload,
				auth: { username, password }
			});
		} catch (error) {
			Sentry.captureException(error);
			console.error(chalk.red(error.response.data.message));
			console.error(chalk.red(JSON.stringify(error.response.data.errors)));
			return false;
		}

		try {
			await fs.promises.mkdir(`${root}/src`);
		} catch (error) {
		}

		const origin = createResponse.data.visual.origin;
		const gitRepoName = createResponse.data.visual.git_repo_name;

		try {
			await fs.promises.mkdir(`${root}/src/${chosenBrand}`);
		} catch (error) {
		}

		const repoPath = `${root}/src/${chosenBrand}/${gitRepoName}`;

		const git = simpleGit();

		try {
			await fs.promises.mkdir(repoPath);
			await git.clone(origin, repoPath, {});
			console.log(chalk.green('Repozitář naklonován'));
		} catch (error) {
			Sentry.captureException(error);
			console.error(error);
			return false;
		}

		console.log(chalk.green(`Repozitář: ${repoPath}`));

		const configContents = {
			name: name,
			description: '',
			format: chosenFormat,
			tags: []
		};

		if (chosenFormat === 'fallback') {
			configContents.fallback_click_tag = '';
		}

		fs.writeFileSync(`${repoPath}/config.json`, JSON.stringify(configContents, null, '\t'));

		await git.cwd(repoPath);
		await git.add('./*');
		await git.commit('Add config.json');

		console.log(chalk.green(`Vytvořen config.json`));
	}
};
