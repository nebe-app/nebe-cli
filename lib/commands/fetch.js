module.exports = class Fetch {
	help() {
		return `Lists all commands`;
	}

	async handle() {
		console.log('fetching');
	}
}
