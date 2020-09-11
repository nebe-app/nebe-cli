module.exports = function apiUrl(url) {
	const [, , ...args] = process.argv;
	const isSazka = args && args.join(' ').indexOf('--sazka') !== -1;

	url = url.trim('/');

	if (isSazka) {
		return `https://beta.nebe.sazka.cz/nebe/api/public/cli/${url}`;
	}

	return `https://www.nebe.app/app/api/public/cli/${url}`;
};
