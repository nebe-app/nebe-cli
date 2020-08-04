const pkg = require('../../package.json');
const Table = require('cli-table');
const fs = require('fs');

module.exports = class Help {
	help() {
		return `Lists all command descriptions`;
	}

	async handle() {
		console.log(`NebeCLI, verze ${pkg.version}`);

		const table = new Table({
			head: ['Příkaz', 'Popis']
		});

		const files = fs.readdirSync(__dirname);

		files.forEach(file => {
			if (file.indexOf('.js') !== -1) {
				const CommandClass = require(`./${file}`);
				if (CommandClass) {
					const command = new CommandClass();
					table.push([file.replace('.js', ''), command.help()]);
				}
			}
		});

		console.log(table.toString());
	}
};
