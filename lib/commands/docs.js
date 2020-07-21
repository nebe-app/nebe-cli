const opn = require('opn');

module.exports = class Fetch {
	help() {
		return `Open documentation`;
	}

	async handle() {
		await opn('https://www.nebe.app/docs');
	}
};
