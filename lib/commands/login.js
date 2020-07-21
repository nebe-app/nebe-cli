module.exports = class Login {
	help() {
		return `Lists all commands`;
	}

	async handle() {
		console.log('login');
	}
}
