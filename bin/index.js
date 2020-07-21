#!/usr/bin/env node

const _ = require('lodash');
const fs = require('fs');
const chalk = require('chalk');
const checkForUpdate = require('../lib/utils/checkForUpdate.js');

const [, , ...args] = process.argv;

let commandName = 'help';

if (args.length > 0) {
	commandName = _.toString(args[0]);
}

if (!fs.existsSync(`${__dirname}/../lib/commands/${commandName}.js`)) {
	console.error(`Command`, chalk.red(commandName), `does not exist. Run`, chalk.blue(`nebe help`), `for the command list`);
	process.exit(0);
}

checkForUpdate();

(async () => {
	const CommandClass = require(`../lib/commands/${commandName}.js`);
	const command = new CommandClass();
	await command.handle();
	process.exit(0);
})();
