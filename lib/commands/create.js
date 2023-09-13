const inquirer = require('inquirer');
const chalk = require('chalk');
const axios = require('axios');
const apiUrl = require('../utils/apiUrl');
const fs = require('fs');
const simpleGit = require('simple-git');
const { getRoot, getUsername, getPassword, setConfig, getConfig, getCommand } = require('../utils/configGetters');
const Sentry = require('@sentry/node');
const open = require('open');

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
			message: 'Which brand should own this template?',
			choices: brands.map((brand) => {
				return {
					name: brand.name,
					value: brand.git_organization_name
				};
			})
		});

		const chosenBrand = brandAnswer.brand;

		const url = `https://app.imagelance.com/${chosenBrand}/visuals`;
		console.log(chalk.blue(`Please create new template in browser: ${url}`));
		await open(url);

		return;

		const formatAnswer = await inquirer.prompt({
			type: 'list',
			name: 'format',
			message: 'What format should the template be?',
			choices: [
				{ value: 'html', name: 'HTML5' },
				{ value: 'image', name: 'Image (jpg, png)' },
				{ value: 'print', name: 'Print (pdf)' },
				{ value: 'video', name: 'Video (mp4, avi)' },
				{ value: 'animation', name: 'Animation (gif, webp)' },
				{ value: 'audio', name: 'Audio (mp3, wav)' },
				{ value: 'fallback', name: 'Fallback (jpg)' }
			]
		});

		const chosenFormat = formatAnswer.format;

		const nameAnswer = await inquirer.prompt({
			type: 'input',
			name: 'name',
			message: `Name of the template (can be changed later in config.json)`,
			validate: (input) => {
				return input && input.length > 3;
			}
		});

		const name = nameAnswer.name;

		const descriptionAnswer = await inquirer.prompt({
			type: 'input',
			name: 'description',
			message: `Description of the template (optional)`
		});

		const description = descriptionAnswer.description;

		const tagsAnswer = await inquirer.prompt({
			type: 'input',
			name: 'tags',
			message: `Tags of the template (optional; separate tags by comma)`
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
			message: `Confirm if data are correct`,
			default: true
		});

		if (!confirm.confirm) {
			process.exit();
		}

		console.log(`Creating template...`);

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
			console.error(error);
			console.error(chalk.red(error.response.data.message));
			console.error(chalk.red(JSON.stringify(error.response.data.errors)));
			return false;
		}

		try {
			await fs.promises.mkdir(`${ root }/src`);
		} catch (error) {
		}

		const origin = createResponse.data.visual.origin;
		const gitRepoName = createResponse.data.visual.git_repo_name;

		try {
			await fs.promises.mkdir(`${ root }/src/${ chosenBrand }`);
		} catch (error) {
		}

		const repoPath = `${ root }/src/${ chosenBrand }/${ gitRepoName }`;

		const git = simpleGit();

		try {
			await fs.promises.mkdir(repoPath);
			await git.clone(origin, repoPath, {});
			console.log(chalk.green('Repository cloned'));
		} catch (error) {
			Sentry.captureException(error);
			console.error(error);
			return false;
		}

		console.log(chalk.green(`Repository: ${ repoPath }`));

		const configContents = {
			name: name,
			description: description,
			format: chosenFormat,
			tags: tags
		};

		if (chosenFormat === 'fallback') {
			configContents.fallback_click_tag = '';
		}

		fs.writeFileSync(`${ repoPath }/config.json`, JSON.stringify(configContents, null, '\t'));
		fs.writeFileSync(`${ repoPath }/schema.json`, JSON.stringify({}, null, '\t'));

		await git.cwd(repoPath);

		/**
		 * Set user.name + user.email for repo
		 */
		const userName = getConfig('name');

		if (userName) {
			await git.addConfig('user.name', userName);
		}

		const userEmail = getConfig('email');

		if (userEmail) {
			await git.addConfig('user.email', userEmail);
		}

		/**
		 * Commit and push first commit
		 */
		await git.add('./*');
		await git.commit('Init commit');
		await git.push('origin', 'master');

		console.log(chalk.green(`Created config.json and first commit has been pushed`));

		setConfig('newestVisual', `${ chosenBrand }/${ gitRepoName }`);

		console.log(chalk.green(`Example templates can be fount at https://github.com/nebe-app`));
		console.log(chalk.green(`Start bundling the template with command: ${ getCommand('dev --newest') } `));
	}
};
