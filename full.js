
const buildTypeWrapper = require('./lib/base');
const types = require('js-prop-types');
const { checkValueType } = types;

const MATCH_DEF = /`([a-z0-9\[\]]+)`/g

function parseJsPropTypesError(message, isResolving = false) {
	const values = [];

	if (/is marked as required/.test(message)) {
		message.replace(MATCH_DEF, (m, m1) => values.push(m1));

		return isResolving ?
			`expected a return value, but instead returned "${values[2]}"` :
			`expected a required input value, but instead received "${values[2]}"`;
	}

	if (/^Invalid param/.test(message)) {
		message.replace(MATCH_DEF, (m, m1) => values.push(m1));

		// const isComplex = /supplied to/.test(message);

		return isResolving ?
			`(${values[0]}) expected a return value of type "${values[3]
			}" but instead returned "${values[1]}"` :

			`(${values[0]}) expected an input value of type "${values[3]
			}" but instead received "${values[1]}"`
	}

	return null;
}

const fullTypeWrap = buildTypeWrapper({
	validateDefinitions(definition, argumentNum, methodName) {
		if (typeof definition !== 'function') {
			throw new TypeError(`${methodName} (${argumentNum
			}) improper validator was provided, expected "function" but received ${typeof definition}`);
		}
	},
	buildInvocator(methodtoWrap, definitions, resolvesTo) {
		const totalChecks = definitions.length;

		return function typedInvocation(...args) {
			// mutate the argument passthough with a null prop

			// const args = rawArgs.length ? rawArgs : [undefined];
			// forward count (instead of forEach to reduce the amount of bulk
			// in stack trace - which is a bad habit I'm trying to kill with this)
			let index = 0;
			for (index; index < totalChecks; index++) {
				// because of quirkiness we need to cast the undefined type to
				// it's objective form so the modded prop-types can detect it
				const value = typeof args[index] === 'undefined' ? undefined : args[index];

				try {
					checkValueType(value, definitions[index]);
				} catch (e) {
					const message = parseJsPropTypesError(e.message);
					if (!message) {
						// something else went wry
						throw e;
					}
					throw new TypeError(`${methodtoWrap.name} (argument ${index + 1}) ${message}`);
				}
			}

			const result = methodtoWrap(...args);

			// conditional resolve
			if (resolvesTo) {
				try {
					checkValueType(result, resolvesTo);
				} catch (e) {
					const message = parseJsPropTypesError(e.message, true);
					if (!message) {
						// something else went wrong
						throw e;
					}
					throw new TypeError(`${methodtoWrap.name} ${message}`);
				}
			}

			return result;
		}
	}
});

// bind types directly to the fullTypeWrap object
Object.assign(fullTypeWrap, types, { types });

module.exports = fullTypeWrap;
