const Sentry = require('@sentry/node');
const config = require('../utils/config');

module.exports = class SendReport {
	async handle() {
		const report = {
			env: process.env,
			config: config.get()
		}

		report.config.lastSyncResponseData = '<skipped>';
		report.config.lastSyncResponseDataSazka = undefined;

		const reportJSON = JSON.stringify(report);

		Sentry.captureException(new Error('Report'), {extra: report});
		console.log(reportJSON);
	}
};
