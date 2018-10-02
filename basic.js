
const buildTypeWrapper = require('./lib/base');
const _ = require('./lib/lodashTypes');
const { isPlainObject } = _;

/**
 * Turns array of strings into readable item, or item form
 * @param  {Array} array List to convert
 * @return {String} Readable string
 */
const humanReadable = (array) => {
	if (array.length < 2) {
		return array[0];
	}
	const commaSeperated = [...array];
	const final = commaSeperated.pop();

	return `${commaSeperated.join(', ')} or ${final}`;
}

/**
 * Object hash map of valid type checks
 * @type {Object}
 */
const typeChecks = Object.assign({}, ...Object.entries(_)
	// extract lodash type checks
	.filter(([key]) => /^is/.test(key))
	// map matching exports to the type check validations
	.map(([key, checker]) => ({ [key]: checker }))
);

// Alias for always true
typeChecks.isAny = () => true;

/**
 * Array of valid types
 * @type {Array}
 */
const validTypeChecks = Object.keys(typeChecks);

const isValidType = type => validTypeChecks.includes(type);

function accepts(baseDefinition) {
	const isMultiTyped = isPlainObject(baseDefinition) && Array.isArray(baseDefinition.anyOf);

	const definitions = isMultiTyped ? baseDefinition.anyOf : [baseDefinition];

	for (const type of definitions) {
		if (!isValidType(type)) {
			throw new TypeError(
				`FATAL: type ${type
				} is not recognized in definitions. Please use a known lodash "is" method`);
		}
	}

	/**
	 * Builds a basic lodash-based type checker
	 * @param  {Any} input Primitive value to validate
	 * @param  {Boolean} [isFatal=true] if set, allows throwing if the provided
	 *    value does not match any expected types
	 * @return {Boolean} True if valid, otherwise false (or throw)
	 */
	return function checkType(input, isFatal = true) {
		for (const type of definitions) {
			// check type
			if (typeChecks[type](input)) return true;
		}

		// checking failed
		if (isFatal) {
			throw new TypeError(
				`value of type matching "${humanReadable(definitions)
				}" but received "${typeof input}"`);
		}

		// return boolean for custom action (if isFatal isnt flagged)
		return false;
	};
};

const basicTypeWrap = buildTypeWrapper({
	validateDefinitions(definition, argumentNum, methodName) {
		try {
			return accepts(definition);
		} catch (e) {
			throw new TypeError(`${methodName} (argument ${argumentNum}) ${e.message}`);
		}
	},
	buildInvocator(methodtoWrap, parsedDefinitions, resolvesTo) {
		const totalChecks = parsedDefinitions.length;

		return function typedInvocation(...args) {
			// forward count (instead of forEach to reduce the amount of bulk
			// in stack trace - which is a bad habit I'm trying to kill with this)
			let index = 0;
			for (index; index < totalChecks; index++) {
				try {
					parsedDefinitions[index](args[index]);
				} catch (e) {
					const message = `${methodtoWrap.name} (argument ${index + 1}) expected a ${e.message}`;
					throw new TypeError(message);
				}
			}

			const result = methodtoWrap(...args);

			// conditional resolve
			if (resolvesTo) {
				try {
					resolvesTo(result);
				} catch (e) {
					const message = `${methodtoWrap.name} expected to return ${e.message}`;
					throw new TypeError(message);
				}
			}

			return result;
		}
	}
});

module.exports = basicTypeWrap;
