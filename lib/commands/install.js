const inquirer = require('inquirer');
const os = require('os');
const fs = require('fs');
const { existsSync, readJsonSync } = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const rimraf = require('rimraf');
const { getRoot, setConfig, getAppEnvironment} = require('../utils/configGetters');

module.exports = class Install {
	async handle() {
		const currentRoot = getRoot();

		if (currentRoot) {
			const confirm = await inquirer.prompt({
				type: 'confirm',
				name: 'confirm',
				message: `Root folder for templates is already set to ${ currentRoot }. Do you want to change the location?`,
				default: false
			});

			if (!confirm.confirm) {
				process.exit();
			}
		}

		const appEnvironment = getAppEnvironment();
		const suffix = appEnvironment === 'client' ? '' : `-${appEnvironment}`;

		const homeDir = path.join(os.homedir(), `imagelance-templates${suffix}`);
		const projectsDir = path.join(os.homedir(), `Projects`, `imagelance-templates${suffix}`);
		const cwdDir = process.cwd();
		const cwdNestDir = path.join(process.cwd(), `imagelance-templates${suffix}`);

		const choices = [
				{ value: 'homeDir', name: `${ homeDir } (~/imagelance-templates${suffix})` },
				{ value: 'projectsDir', name: `${ projectsDir } (~/Projects/imagelance-templates${suffix})` },
				{ value: 'cwdDir', name: `${ cwdDir } (Current folder)` },
				{ value: 'cwdNestDir', name: `${ cwdNestDir } (Create folder /imagelance-templates${suffix} in current folder)` }
			];

		const rootAnswer = await inquirer.prompt({
			type: 'list',
			name: 'root',
			message: 'Where should be templates synchronized on disk?',
			choices
		});

		let dir;

		switch (rootAnswer.root) {
			case 'cwdDir':
				dir = cwdDir;
				break;
			case 'cwdNestDir':
				try {
					await fs.promises.mkdir(path.join('.', `imagelance-templates${suffix}`));
				} catch (error) {
				}
				dir = cwdNestDir;
				break;
			case 'homeDir':
				try {
					await fs.promises.mkdir(path.join(os.homedir(), `imagelance-templates${suffix}`));
				} catch (error) {
				}
				dir = homeDir;
				break;
			case 'projectsDir':
				try {
					await fs.promises.mkdir(path.join(os.homedir(), 'Projects'));
				} catch (error) {
				}
				try {
					await fs.promises.mkdir(path.join(os.homedir(), 'Projects', `imagelance-templates${suffix}`));
				} catch (error) {
				}
				dir = projectsDir;
				break;
		}

		if (dir) {
			const root = dir.toString().split(path.sep).join('/');

			setConfig('root', root);
			console.log(`Root folder for templates set to:`, chalk.blue(dir));

			// replace wrong package json, that could contain bad version of postcss with custom one
			const packageJsonPath = path.join(root, 'package.json');

			if (existsSync(packageJsonPath)) {
				rimraf.sync(packageJsonPath);
				console.log(`Deleted old ${ path.join(root, 'package.json') }`);
			}

			const packageJsonContents = readJsonSync(path.join(__dirname, '..', 'assets', 'packageJsonTemplate.json'));

			fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonContents, null, '\t'));
			console.log(`Created new ${ packageJsonPath }`);
		}
	}
};
