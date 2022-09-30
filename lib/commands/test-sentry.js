const Sentry = require('@sentry/node');

module.exports = class Sync {
	async handle() {
		Sentry.captureMessage('Test');
		console.log('OK');
		throw new Error('Hello World');
	}
};
