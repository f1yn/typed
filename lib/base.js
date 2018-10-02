
function buildTypeWrapper({
	validateDefinitions,
	buildInvocator,
}) {
	if (typeof buildInvocator !== 'function') {
		throw new TypeError(
		`FATAL: An invocation builder must be passed to the TypeWrapper builder, but a ${
		typeof buildInvocator} was passed instead`);
	}

	return function typeWrap(methodtoWrap, firstArg, ...rawArgs) {
		if (typeof methodtoWrap !== 'function') {
			throw new TypeError(
				`FATAL: type-checking requires method argument to be of type function, but instead received ${
					typeof methodtoWrap}`);
		}

		/**
		 * Based on the format of the function call, allows opt-in type checking
		 * for the return value of the function
		 * @type {Function}
		 */
		let resolvesTo = null;
		let argDefinitions = null;

		if (Array.isArray(firstArg)) {
			// treat as argument pattern (method, [arg1, arg2, ...], return)
			argDefinitions = firstArg
			resolvesTo = rawArgs[0];
		} else {
			// treat as shorthand pattern (method, arg1, arg2, ...)
			argDefinitions = [firstArg, ...rawArgs];
		}

		// if a resolver value is detected then attempt to assign/parse it
		if (resolvesTo) {
			const newResolver = validateDefinitions(resolvesTo, 0, methodtoWrap.name);

			// assign the rew resolver
			if (typeof newResolver !== 'undefined' && newResolver) {
				resolvesTo = newResolver;
			}
		}

		// if a validator is passed then validate the definitions beforehand
		// treats as optional map to pass to safe invocation handle
		const generatedParsers = (typeof validateDefinitions === 'function') ?
			argDefinitions.map((definition, index) =>
				// validate each definition
				validateDefinitions(definition, index + 1, methodtoWrap.name))
				// and remove any undefined references
				.filter(v => typeof v !== 'undefined') : [];

		// resolve definitions to pass to safe definition builder
		const definitions = generatedParsers.length ? generatedParsers : argDefinitions;

		// build invocation handler to ensure that props are being passed and checked
		const safeInvocationHandle = buildInvocator(methodtoWrap, definitions, resolvesTo);

		if (typeof safeInvocationHandle !== 'function') {
			throw new TypeError(
				`FATAL: type-checking requires buildInvocator argument to return type function, but instead received ${
					typeof methodtoWrap}`);
		}

		// return the generated invocation handler
		return safeInvocationHandle;
	}
}

module.exports = buildTypeWrapper;
