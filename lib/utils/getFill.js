const fs = require('fs-extra');

module.exports = function getFill(schemaPath) {
	let schema = null;
	let demoInputs = {};

	if (fs.existsSync(schemaPath)) {
		try {
			const schemaContents = fs.readFileSync(schemaPath);
			schema = JSON.parse(schemaContents);

			for (let slotKey in schema) {
				if (!schema.hasOwnProperty(slotKey)) {
					continue;
				}
				if (schema[slotKey].type === 'array') {
					demoInputs[slotKey] = [];

					const getSubDemoInputs = (i) => {
						let subDemoInputs = {};
						for (let subSlotKey in schema[slotKey].schema) {
							if (!schema[slotKey].schema.hasOwnProperty(subSlotKey)) {
								continue;
							}
							const value = schema[slotKey].schema[subSlotKey].value;

							if (Array.isArray(value)) {
								if (i >= 0) {
									subDemoInputs[subSlotKey] = value[i % value.length];
								} else {
									subDemoInputs[subSlotKey] = value[Math.floor(Math.random() * value.length)];
								}
							} else {
								subDemoInputs[subSlotKey] = value;
							}
						}
						return subDemoInputs;
					};

					const getDemoInputsCount = () => {
						for (let subSlotKey in schema[slotKey].schema) {
							if (!schema[slotKey].schema.hasOwnProperty(subSlotKey)) {
								continue;
							}
							const value = schema[slotKey].schema[subSlotKey].value;
							if (Array.isArray(value)) {
								return value.length;
							}
						}
						return -1;
					};

					let min = parseInt(schema[slotKey].min);
					let max = parseInt(schema[slotKey].max);
					let count = parseInt(schema[slotKey].count);

					if (min < 0) {
						min = 0;
					}
					if (min > 1000) {
						min = 1000;
					}
					if (max < 0) {
						max = 0;
					}
					if (max > 1000) {
						max = 1000;
					}
					if (count < 0) {
						count = 0;
					}
					if (count > 1000) {
						count = 1000;
					}
					if (max < min) {
						max = min;
					}

					const demoInputsCount = getDemoInputsCount();
					if (demoInputsCount !== -1) {
						min = 1;
						max = demoInputsCount;
					}

					if (min && max) {
						for (let i = min; i <= max; i++) {
							demoInputs[slotKey].push(getSubDemoInputs(i - 1));
						}
					} else if (schema[slotKey].count) {
						for (let i = 1; i <= count; i++) {
							demoInputs[slotKey].push(getSubDemoInputs(i - 1));
						}
					}

				} else if (typeof schema[slotKey].value !== 'undefined') {
					const value = schema[slotKey].value;
					if (Array.isArray(value)) {
						demoInputs[slotKey] = value[Math.floor(Math.random() * value.length)];
					} else {
						demoInputs[slotKey] = value;
					}
				} else {
					demoInputs[slotKey] = null;
				}
			}
		} catch (e) {
			console.error(e);
		}
	}

	console.log(`Demo inputs are`, demoInputs);
	const demoInputsJson = JSON.stringify(demoInputs);
	const schemaJson = JSON.stringify(schema);

	return `<script>
		window.EXIT = (url) => {
			url = url ? url : window.clickTag;
			console.log('Called EXIT with value: ' + url)
		};

		window.SCHEMA = JSON.parse('${schemaJson}');
		window.INPUTS = JSON.parse('${demoInputsJson}');

		console.log('Filling visual with inputs', window.INPUTS);

		window.FILL(window.INPUTS, true).then((fillResult) => {
			console.log('Fill output is', fillResult);

			if (typeof window.AFTER_FILL === 'function') {
				console.log('Calling after fill hook');
				window.AFTER_FILL();
			}
		});
	</script>`;
};
