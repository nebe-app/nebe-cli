const pkg = require('../../package.json');
const Table = require('cli-table');

module.exports = class Help {
	help() {
		return `Lists all command descriptions`;
	}

	async handle() {
		console.log(`nebe-cli, version ${pkg.version}`);

		const table = new Table({
			head: ['Command', 'Description']
		});

		const commands = {
			clone: `Clone existing template`,
			'convert-pdf': `Convert pdf to jpg`,
			create: `Creates new template`,
			dev: `Run development server to create templates`,
			install: `Set home directory for templates`,
			sync: `Download all templates`,
			fetch: `Fetch all templates`,
			pull: `Pull all templates`,
			push: `Push all templates`,
			status: `Git status of all templates`,
		};

		for (let commandName in commands) {
			table.push([commandName, commands[commandName]]);
		}

		/*
		Too slow
		const files = fs.readdirSync(__dirname);

		files.forEach(file => {
			if (file.indexOf('.js') !== -1) {
				console.log(file);
				const CommandClass = require(`./${file}`);
				if (CommandClass) {
					const command = new CommandClass();
					table.push([file.replace('.js', ''), command.help()]);
				}
			}
		});*/

		console.log(table.toString());
	}
};
