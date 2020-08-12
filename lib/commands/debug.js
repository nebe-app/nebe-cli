const config = require('../utils/config');

module.exports = class Debug {
	async handle() {
		console.log(config.get());
	}
};
