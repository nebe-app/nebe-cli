const updateNotifier = require('update-notifier');
const pkg = require('../../package.json');

module.exports = function checkForUpdate () {
	const notifier = updateNotifier({pkg});
	notifier.notify();
}
