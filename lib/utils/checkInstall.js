const config = require('../utils/config');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = async function checkInstall() {
	await checkRoot();
	await checkWorkingFolder();
	await checkLogin();
};

const checkRoot = async function() {
	const root = config.get('root');

	if (!root) {
		console.error(chalk.red(`Chyba:`), `Nemáte nastavenou domovskou složku pro kreativy! Prosím spusťte příkaz`, chalk.blue(`nebe install`));
		process.exit();
	}

	try {
		const stats = await fs.promises.lstat(root);

		if (!stats.isDirectory()) {
			console.error(chalk.red(`Chyba:`), `Domovská složka pro kreativy neexistuje! Prosím spusťte příkaz`, chalk.blue(`nebe install`));
			process.exit();
		}
	} catch (error) {
		console.error(chalk.red(`Chyba:`), `Domovská složka pro kreativy neexistuje! Prosím spusťte příkaz`, chalk.blue(`nebe install`));
		process.exit();
	}
};

const checkWorkingFolder = async function() {
	const folder = path.join(os.homedir(), '.nebe');

	try {
		const stats = await fs.promises.lstat(folder);

		if (!stats.isDirectory()) {
			throw new Error('Not directory');
		}
	} catch (error) {
		await fs.promises.mkdir(folder);
	}
};

const checkLogin = function() {
	const username = config.get('username');

	if (!username) {
		console.error(chalk.red(`Chyba:`), `Nejste přihlášeni! Prosím spusťte příkaz`, chalk.blue(`nebe login`));
		process.exit();
	}

	const password = config.get('password');

	if (!password) {
		console.error(chalk.red(`Chyba:`), `Nejste přihlášeni! Prosím spusťte příkaz`, chalk.blue(`nebe login`));
		process.exit();
	}
};
