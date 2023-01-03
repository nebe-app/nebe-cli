const inquirer = require('inquirer');
const axios = require('axios');
const os = require('os');
const chalk = require('chalk');
const apiUrl = require('../utils/apiUrl');
const {getRoot, setConfig, getAppEnvironment} = require('../utils/configGetters');
const Sentry = require('@sentry/node');
const open = require('open');
const crypto = require('crypto');
const argv = require('minimist')(process.argv.slice(2));

module.exports = class Login {
	async handle() {
		const useAutologinPrompt = await inquirer.prompt({
			type: 'list',
			name: 'autologin',
			message: 'Select login method',
			choices: [{name: 'Browser (preferred)', value: 'autologin'}, {name: 'Enter email address and password', value: 'legacy'}]
		});
		const loginMethod = useAutologinPrompt.autologin;

		if (loginMethod === 'autologin') {
			console.log(chalk.green(`Logging in using browser...`));

			const clientHash = crypto.randomBytes(40).toString('hex');
			const secretHash = crypto.randomBytes(40).toString('hex');

			await axios.post(apiUrl('autologin-request'), {
				client_hash: clientHash,
				secret_hash: secretHash,
				meta: {
					hostname: os.hostname(),
					os: os.type(),
				}
			});

			const path = `/auth/autologin/${clientHash}`;
			const appEnvironment = getAppEnvironment();

			let url = appEnvironment === 'client'
				? `https://app.imagelance.com${path}`
				: `https://${appEnvironment}.imagelance.com${path}`;

			if (argv.local) {
				url = `http://localhost:8080${path}`
			}
			await open(url);
			console.log(chalk.green(`Opening browser with URL: ${url}`));

			await new Promise((resolve) => {
				let checks = 0;
				const checkInterval = setInterval(async () => {
					if (argv.local) {
						console.log(`Check #${checks}`);
					}

					if (checks > 60) { // 2 minutes, check every 2 seconds
						clearInterval(checkInterval);
						console.log(chalk.red(`Login attempt has expired, try again`));
						resolve();
					}

					checks++;

					try {
						const response = await axios.post(apiUrl('autologin-check'), {
							client_hash: clientHash,
							secret_hash: secretHash,
						});

						if (response.data.user) {
							setConfig('username', response.data.user.git_username);
							setConfig('password', response.data.user.git_password);
							setConfig('email', response.data.user.email);
							setConfig('user_id', response.data.user.id);
							setConfig('name', response.data.user.name);

							console.log(chalk.green(`User ${response.data.user.email} has been logged in`));

							clearInterval(checkInterval);
							resolve();
						}
					} catch (error) {
						console.error(error);
						console.error(error.response.data);
					}

				}, 2000);
			});

		} else {
			const answer1 = await inquirer.prompt({
				type: 'email',
				name: 'email',
				message: 'E-mail'
			});

			setConfig('email', answer1.email);

			const answer2 = await inquirer.prompt({
				type: 'password',
				name: 'password',
				message: 'Password'
			});

			console.log('Logging in...');

			try {
				const response = await axios.post(apiUrl('login'), {
					hostname: os.hostname(),
					os: os.type(),
					root: getRoot()
				}, {
					auth: {
						username: answer1.email,
						password: answer2.password
					}
				});

				setConfig('username', response.data.user.git_username);
				setConfig('password', response.data.user.git_password);
				setConfig('email', response.data.user.email);
				setConfig('user_id', response.data.user.id);
				setConfig('name', response.data.user.name);

				console.log(chalk.green(`User ${response.data.user.email} has been logged in`));

			} catch (error) {
				Sentry.captureException(error);
				console.error(chalk.red(JSON.stringify(error.response.data)));
			}
		}
	}
};
