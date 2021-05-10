const fs = require('fs-extra');
const path = require('path');
const rimraf = require('rimraf');
const {getRoot} = require('../utils/configGetters');

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
		rimraf.sync(path.join(root, 'package.json'));
		console.log('Deleted ' + path.join(root, 'package.json'));

		const packageJsonContents = {
			"browserslist": [
				"last 3 Chrome versions"
			],
			"devDependencies": {
				"autoprefixer": "^9.8.6",
				"cssnano": "^4.1.10",
				"postcss": "^7.0.35",
				"postcss-modules": "^3.2.2",
				"sass": "^1.32.12"
			}
		};

		fs.writeFileSync(`${root}/package.json`, JSON.stringify(packageJsonContents, null, '\t'));
		console.log('Created new ' + path.join(root, 'package.json'));
	}
};
