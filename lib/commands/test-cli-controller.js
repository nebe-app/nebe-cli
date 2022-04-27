const axios = require('axios');
const apiUrl = require('../utils/apiUrl');
const {getUsername, getPassword} = require('../utils/configGetters');
const Sentry = require('@sentry/node');

module.exports = class TestCliController {
	async handle() {
		const username = getUsername();
		const password = getPassword();

		try {
			const response = await axios.get(apiUrl('visual'), {
				auth: { username, password }
			});
			console.log(response.data);
		} catch (error) {
			Sentry.captureException(error);
			console.log(error);
		}
	}
};
