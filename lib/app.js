const _ = require('lodash');
const fs = require('fs');
const chalk = require('chalk');
const checkForUpdate = require('../lib/utils/checkForUpdate.js');
const checkInstall = require('../lib/utils/checkInstall.js');
const {isSazka, getUsername} = require('./utils/configGetters');
const pkg = require('../package.json');
const Sentry = require('@sentry/node');

module.exports = async function app() {
	// Sentry

	Sentry.init({
		dsn: 'https://ac078c61624944c8a56ce290ffdb5dd8@o170788.ingest.sentry.io/5432248',
		release: `nebe-cli@${pkg.version}`,
		tags: {version: pkg.version},
		config: {
			captureUnhandledRejections: true
		},
	});

	const username = getUsername();

	if (username){
		Sentry.setUser({username});
	}

	// Sazka

	if (isSazka()) {
		console.log(chalk.yellow(`⬡ Sazka`));
	}

	checkForUpdate();

	const [, , ...args] = process.argv;

	let commandName = 'help';

	if (args.length > 0) {
		commandName = _.toString(args[0]);
	}

	if (commandName === 'serve') {
		console.log(chalk.yellow('Info: Nově se příkaz jmenuje "nebe dev" 🤓'));
		commandName = 'dev';
	}

	if (commandName !== 'install' && commandName !== 'login' && commandName !== 'help') {
		await checkInstall();
	}

	if (!fs.existsSync(`${__dirname}/../lib/commands/${commandName}.js`)) {
		console.error(`Command`, chalk.red(commandName), `does not exist. Run`, chalk.blue(`nebe help`), `for the command list`);
		process.exit(0);
	}

	const CommandClass = require(`../lib/commands/${commandName}.js`);
	const command = new CommandClass();
	const commandIndex = process.argv.indexOf(commandName);
	const commandArgs = commandIndex > 0 ? process.argv.slice(commandIndex + 1) : [];
	await command.handle(commandArgs);

	if (command.keepRunning !== true) {
		process.exit(0);
	}
};
