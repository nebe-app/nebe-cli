const config = require('../utils/config');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const simpleGit = require('simple-git');
const apiUrl = require('../utils/apiUrl');

module.exports = class Push {
	async handle() {
		const root = config.get('root');

		const git = simpleGit();


		await git.cwd(repoPath);

		try {
			const status = await git.status();

			if (status.not_added.length || status.staged.length || status.created.length) {
				await git.add('./*');
				await git.commit('Init commit');
				await git.push('origin', 'master');
			}

		} catch (error) {

		}


	}
};

