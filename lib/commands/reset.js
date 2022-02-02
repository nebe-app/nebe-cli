const fs = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');
const { getRoot } = require('../utils/configGetters');

module.exports = class Reset {
	constructor() {
		this.keepRunning = false;
	}

	async handle() {
		const root = getRoot();

		rimraf.sync(path.join(root, 'node_modules'));
		console.log('Deleted ' + path.join(root, 'node_modules'));
		rimraf.sync(path.join(root, 'package-lock.json'));
		console.log('Deleted ' + path.join(root, 'package-lock.json'));
		rimraf.sync(path.join(root, 'yarn.lock'));
		console.log('Deleted ' + path.join(root, 'yarn.lock'));
		rimraf.sync(path.join(root, 'package.json'));
		console.log('Deleted ' + path.join(root, 'package.json'));

		const packageJsonContents = fs.readJsonSync(path.join(__dirname, '..', 'assets', 'packageJsonTemplate.json'));

		fs.writeFileSync(`${root}/package.json`, JSON.stringify(packageJsonContents, null, '\t'));
		console.log('Created new ' + path.join(root, 'package.json'));
	}
};
