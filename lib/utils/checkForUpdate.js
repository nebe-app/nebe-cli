const updateNotifier = require('update-notifier');
const pkg = require('../../package.json');

module.exports = function checkForUpdate() {
	const notifier = updateNotifier({
		pkg,
		updateCheckInterval: 1000 * 60
	});
	notifier.notify();

	if (this.verbose) {
		console.log(`Checking update`, notifier.update);
	}
};
