module.exports = class Create {
	help() {
		return `Lists all commands`;
	}

	async handle() {
		console.log('create');
	}
};
