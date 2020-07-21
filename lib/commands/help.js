const pkg = require('../../package.json');

module.exports = class Help {
	help() {
		return `Lists all commands`;
	}

	async handle() {
		console.log('helping', pkg.version);
	}
};
