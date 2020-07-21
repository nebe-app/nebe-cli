module.exports = class Help {
	help() {
		return `Lists all commands`;
	}

	async handle() {
		console.log('helping');
	}
};
