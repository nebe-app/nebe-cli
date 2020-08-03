module.exports = function apiUrl(url) {
	url = url.trim('/');
	return `https://www.nebe.app/app/api/public/cli/${url}`;
	return `http://localhost/nebe/api/public/cli/${url}`;
};
