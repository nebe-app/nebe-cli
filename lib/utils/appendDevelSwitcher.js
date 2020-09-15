module.exports = function appendDevelSwitcher(fill) {
	return `${fill}
	<script>
		if (typeof window.SWITCH_DEVELOPMENT === 'undefined') {
			window.SWITCH_DEVELOPMENT = function (event) {
				if (event.key.toLowerCase() === 'd') {
					console.log('Switching development mode');
					window.DEVEL = !window.DEVEL;
					document.querySelector('html').classList.toggle('is-development', window.DEVEL);
				}};
			document.addEventListener('keydown', window.SWITCH_DEVELOPMENT);
		}
	</script>`;
};
