const config = require('../utils/config');
const inquirer = require('inquirer');
const axios = require('axios');

module.exports = class Login {
	help() {
		return `Log in`;
	}

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
			message: 'Password'
		});

		console.log('Logging in');
		//const url = `https://www.nebe.app/app/api/public/cli/login`;
		const url = `http://localhost/nebe/api/public/cli/login`;

		const response = await axios.get(url, {
			auth: {
				username: answer1.email,
				password: answer2.password
			}
		});

		console.log(response.data);

		config.set('username', response.data.user.git_username);
		config.set('password', response.data.user.git_password);
		console.log('Git credentials saved');
	}
};
