
const buildTypeWrapper = require('./lib/base');
const types = require('@o3/prop-types');
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

function checkValueTypeCaller(baseValue, definition, isResolving = false) {
	// because of quirkiness we need to cast the undefined type to
	// it's objective form so the modded prop-types can detect it
	const value = typeof baseValue === 'undefined' ? undefined : baseValue;

	try {
		checkValueType(value, definition);
		return null;
	} catch (e) {
		const message = parseJsPropTypesError(e.message, isResolving);
		if (!message) {
			// something else went wry: bubble up the exception
			throw e;
		}
		return message;
	}
}

const fullTypeWrap = buildTypeWrapper({
	validateDefinitions(definition, argumentNum, methodName) {
		if (typeof definition !== 'function') {
			throw new TypeError(`${methodName} (${argumentNum
			}) improper validator was provided, expected "function" but received ${
			typeof definition}`);
		}
	},
	buildInvocator(methodtoWrap, definitions, resolvesTo) {
		const totalChecks = definitions.length;

		/**
		 * Called when method returns a Promise-like object
		 * @param  {Promise} resultPromise The promise to resolve
		 * @param  {definition} resolvesTo the definition expected
		 * @return {Promise} Resolves with result when resultPromise completes
		 */
		async function resolveAsyncInvocation(resultPromise, resolvesTo) {
			// wait for promise to resolve and then validate
			const result = await resultPromise;
			const errorMessage = checkValueTypeCaller(result, resolvesTo);
			if (errorMessage) throw new TypeError(`${methodtoWrap.name} ${errorMessage}`);
			return result;
		}

		return function typedInvocation(...args) {
			// forward count (instead of forEach to reduce the amount of bulk
			// in stack trace - which is a bad habit I'm trying to kill with this)
			let index = 0;
			for (index; index < totalChecks; index++) {
				const errorMessage = checkValueTypeCaller(args[index], definitions[index]);
				if (errorMessage) throw new TypeError(`${methodtoWrap.name} (argument ${index + 1}) ${errorMessage}`);
			}

			const result = methodtoWrap(...args);

			// conditional resolve
			if (resolvesTo) {
				if (typeof result.then === 'function') {
					// hand over to async resolver
					return resolveAsyncInvocation(result, resolvesTo);
				}
				const errorMessage = checkValueTypeCaller(result, resolvesTo, true);
				if (errorMessage) throw new TypeError(`${methodtoWrap.name} ${errorMessage}`);
			}

			return result;
		}
	}
});

// bind types directly to the fullTypeWrap object
Object.assign(fullTypeWrap, types, { types });

module.exports = fullTypeWrap;
