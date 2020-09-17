const pkg = require('../../package.json');
const Table = require('cli-table');

module.exports = class Help {
	help() {
		return `Lists all command descriptions`;
	}

	async handle() {
		console.log(`NebeCLI, verze ${pkg.version}`);

		const table = new Table({
			head: ['Příkaz', 'Popis']
		});

		const commands = {
			clone: `Clone existing visual`,
			'convert-pdf': `Convert pdf to jpg`,
			create: `Creates new visual`,
			dev: `Run development server to create visuals`,
			install: `Set home directory for visuals`,
			sync: `Download all visuals`,
			fetch: `Fetch all visuals`,
			pull: `Pull all visuals`,
			push: `Push all visuals`,
			status: `Git status of all visuals`,
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
