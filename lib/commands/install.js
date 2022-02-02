const inquirer = require('inquirer');
const os = require('os');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { isSazka, getRoot, setConfig } = require('../utils/configGetters');

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
		const sazkaDir = path.join(os.homedir(), `Projects`, `nebe-visuals-sazka`);
		const cwdDir = process.cwd();
		const cwdNestDir = path.join(process.cwd(), 'nebe-visuals');

		const choices = isSazka()
			? [
				{ value: 'sazkaDir', name: `${projectsDir} (~/Projects/nebe-visuals-sazka)` },
				{ value: 'cwdDir', name: `${cwdDir} (Aktuální složka)` },
			]
			: [
				{ value: 'homeDir', name: `${homeDir} (~/nebe-visuals)` },
				{ value: 'projectsDir', name: `${projectsDir} (~/Projects/nebe-visuals)` },
				{ value: 'cwdDir', name: `${cwdDir} (Aktuální složka)` },
				{ value: 'cwdNestDir', name: `${cwdNestDir} (Nová složka v aktuální složce)` }
			];

		const rootAnswer = await inquirer.prompt({
			type: 'list',
			name: 'root',
			message: 'Kam umístit domovskou složku pro kreativy?',
			choices
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
				} catch (error) {
				}
				try {
					await fs.promises.mkdir(path.join(os.homedir(), 'Projects', 'nebe-visuals'));
				} catch (error) {
				}
				dir = projectsDir;
				break;
			case 'sazkaDir':
				try {
					await fs.promises.mkdir(path.join(os.homedir(), 'Projects'));
				} catch (error) {
				}
				try {
					await fs.promises.mkdir(path.join(os.homedir(), 'Projects', 'nebe-visuals-sazka'));
				} catch (error) {
				}
				dir = sazkaDir;
				break;
		}

		if (dir) {
			setConfig('root', dir.replaceAll(path.sep, '/'));
			console.log(`Domovská složka nastavena na:`, chalk.blue(dir));
		}
	}
};
