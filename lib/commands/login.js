const config = require('../utils/config');
const inquirer = require('inquirer');
const axios = require('axios');
const os = require('os');
const chalk = require('chalk');
const apiUrl = require('../utils/apiUrl');

module.exports = class Login {
	async handle() {
		const answer1 = await inquirer.prompt({
			type: 'email',
			name: 'email',
			message: 'E-mail'
		});

		config.set('email', answer1.email);

		const answer2 = await inquirer.prompt({
			type: 'password',
			name: 'password',
			message: 'Heslo'
		});

		console.log('Přihlašuji...');

		try {
			const response = await axios.post(apiUrl('login'), {
				hostname: os.hostname(),
				os: os.type(),
				root: config.get('root')
			}, {
				auth: {
					username: answer1.email,
					password: answer2.password
				}
			});

			config.set('username', response.data.user.git_username);
			config.set('password', response.data.user.git_password);
			config.set('email', response.data.user.email);
			config.set('user_id', response.data.user.id);

			console.log(chalk.green(`Uživatel ${response.data.user.email} přihlášen`));

		} catch (error) {
			console.error(chalk.red(JSON.stringify(error.response.data)));
		}
	}
};
