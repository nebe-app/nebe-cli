module.exports = class Publish {
	help() {
		return `Lists all commands`;
	}

	async handle() {
		console.log('publishing');
	}
};
