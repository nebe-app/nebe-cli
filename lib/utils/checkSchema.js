const chalk = require('chalk');
const fs = require('fs-extra');

module.exports = async function checkSchema(schemaPath) {
	let errors = 0;

	if (!fs.existsSync(schemaPath)) {
		console.error(chalk.red(`schema.json does not exist!`));
		return false;
	}

	const schemaContents = fs.readJsonSync(schemaPath);

	if (!schemaContents) {
		console.error(chalk.red(`schema.json is not valid JSON`));
		return false;
	}

	for (let i in schemaContents) {
		if (schemaContents.hasOwnProperty(i) === false) {
			continue;
		}

		const schemaRow = schemaContents[i];

		if (/[a-z0-9_]/.test(i) === false) {
			console.error(chalk.red(`Slot key "${i}" can contain only lowercase letters, numbers and underscores (_)`));
			errors++;
		}

		if (typeof schemaRow.label !== 'string') {
			console.error(chalk.red(`Slot label "${i}" is not defined or not a string`));
			errors++;
		}

		if (typeof schemaRow.value === 'undefined') {
			console.error(chalk.red(`Slot value "${i}" is not defined`));
			errors++;
		}
	}

	if (errors === 0) {
		console.log(chalk.green(`Schema seems ok`));
	}

	return true;
};
