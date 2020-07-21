module.exports = class Outdated {
	help() {
		return `Lists all commands`;
	}

	async handle() {
		console.log('outdated');
	}
};
