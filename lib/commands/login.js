module.exports = class Login {
	help() {
		return `Save login information`;
	}

	async handle(args) {
		console.log('login', args);
	}
};
