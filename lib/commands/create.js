const inquirer = require('inquirer');

module.exports = class Create {
	help() {
		return `Creates new visual`;
	}

	async handle() {

		const brandAnswer = await inquirer.prompt({
			type: 'list',
			name: 'brand',
			message: 'Pro který brand založit kreativu?',
			choices: brands.map(brandPath => brandPath.toString()
				.replace('src/', '')
				.replace('/brand.json', ''))
		});
	}
};
