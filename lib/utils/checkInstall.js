const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const os = require('os');
const {getRoot, getUsername, getPassword, getBin} = require('./configGetters');

module.exports = async function checkInstall() {
	await checkRoot();
	await checkWorkingFolder();
	await checkLogin();
};

const checkRoot = async function() {
	const root = getRoot();

	if (!root) {
		console.error(chalk.red(`Chyba:`), `Nemáte nastavenou domovskou složku pro kreativy! Prosím spusťte příkaz`, chalk.blue(`${getBin()} install`));
		process.exit();
	}

	try {
		const stats = await fs.promises.lstat(root);

		if (!stats.isDirectory()) {
			console.error(chalk.red(`Chyba:`), `Domovská složka pro kreativy neexistuje! Prosím spusťte příkaz`, chalk.blue(`${getBin()} install`));
			process.exit();
		}
	} catch (error) {
		console.error(chalk.red(`Chyba:`), `Domovská složka pro kreativy neexistuje! Prosím spusťte příkaz`, chalk.blue(`${getBin()} install`));
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
	const username = getUsername();

	if (!username) {
		console.error(chalk.red(`Chyba:`), `Nejste přihlášeni! Prosím spusťte příkaz`, chalk.blue(`${getBin()} login`));
		process.exit();
	}

	const password = getPassword();

	if (!password) {
		console.error(chalk.red(`Chyba:`), `Nejste přihlášeni! Prosím spusťte příkaz`, chalk.blue(`${getBin()} login`));
		process.exit();
	}
};
