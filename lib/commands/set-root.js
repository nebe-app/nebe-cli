const config = require('../utils/config');

module.exports = class SetRoot {
	help() {
		return `Save root directory`;
	}

	async handle(args) {
		config.set('root', process.cwd());
		console.log('Root set');
	}
};
