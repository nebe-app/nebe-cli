const inquirer = require('inquirer');
const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const {getRoot, setConfig} = require('../utils/configGetters');

module.exports = class Install {
	async handle() {
		const currentRoot = getRoot();

		if (currentRoot) {
			const confirm = await inquirer.prompt({
				type: 'confirm',
				name: 'confirm',
				message: `Domovská složka pro kreativy je již nastavena na ${currentRoot}. Chcete ji změnit?`,
				default: false
			});

			if (!confirm.confirm) {
				process.exit();
			}
		}

		const homeDir = path.join(os.homedir(), `nebe-visuals`);
		const projectsDir = path.join(os.homedir(), `Projects`, `nebe-visuals`);
		const cwdDir = process.cwd();
		const cwdNestDir = path.join(process.cwd(), 'nebe-visuals');

		const rootAnswer = await inquirer.prompt({
			type: 'list',
			name: 'root',
			message: 'Kam umístit domovskou složku pro kreativy?',
			choices: [
				{ value: 'homeDir', name: `${homeDir} (~/nebe-visuals)` },
				{ value: 'projectsDir', name: `${projectsDir} (~/Projects/nebe-visuals)` },
				{ value: 'cwdDir', name: `${cwdDir} (Aktuální složka)` },
				{ value: 'cwdNestDir', name: `${cwdNestDir} (Nová složka v aktuální složce)` }
			]
		});

		let dir;

		switch (rootAnswer.root) {
			case 'cwdDir':
				dir = cwdDir;
				break;
			case 'cwdNestDir':
				try {
					await fs.promises.mkdir(path.join('.', 'nebe-visuals'));
				} catch (error) {
				}
				dir = cwdNestDir;
				break;
			case 'homeDir':
				try {
					await fs.promises.mkdir(path.join(os.homedir(), 'nebe-visuals'));
				} catch (error) {
				}
				dir = homeDir;
				break;
			case 'projectsDir':
				try {
					await fs.promises.mkdir(path.join(os.homedir(), 'Projects'));
					await fs.promises.mkdir(path.join(os.homedir(), 'Projects', 'nebe-visuals'));
				} catch (error) {
				}
				dir = projectsDir;
				break;
		}

		if (dir) {
			setConfig('root', dir);
			console.log(`Domovská složka nastavena na:`, chalk.blue(dir));
		}
	}
};
