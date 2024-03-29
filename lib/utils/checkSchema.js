const chalk = require('chalk');
const fs = require('fs-extra');
const axios = require('axios');
const Sentry = require('@sentry/node');

module.exports = async function checkSchema(schemaPath, state) {
	if (!fs.existsSync(schemaPath)) {
		console.error(chalk.red(`schema.json does not exist!`));
		return false;
	}

	const schemaContents = fs.readJsonSync(schemaPath);

	if (!schemaContents) {
		console.error(chalk.red(`schema.json is not valid JSON`));
		return false;
	}

	try {
		const response = await axios.post('https://utilities.imagelance.com/visual-processor/schema', schemaContents);
		const data = response.data;

		state.schema = data;

		const valid = data.valid;
		const log = data.log;

		if (valid) {
			console.log(chalk.green(`Schema looks good`));
			return true;
		}

		console.error(chalk.red(`Errors when validating schema:`));

		log.forEach((error) => {
			console.error(chalk.red(error.message));
		});

		return false;

	} catch (error) {
		Sentry.captureException(error);
		console.error(chalk.red(`Errors when validating schema`));
		console.error(chalk.red(JSON.stringify(error.response.data)));

		return false;
	}
};
