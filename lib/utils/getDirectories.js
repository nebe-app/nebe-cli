const fs = require('fs');

module.exports = async function getDirectories(source) {
	const files = await fs.promises.readdir(source, { withFileTypes: true });
	return files.filter(dir => dir.isDirectory())
		.map(dir => dir.name);
};
