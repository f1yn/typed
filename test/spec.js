/**
 * Requires that js-prop-types be installed
 *
 * These tests will be a WIP for quite some time
 */

const chai = require('chai');
const { expect } = chai;

const typedFull = require('../full');
const typedBasic = require('../basic');

const { types } = typedFull;

function addNumbers(number1, number2) {
	return number1 + number2;
}

function addNumbersBroken(number1, number2) {
	return 'string';
}

describe('syntax', () => {
	describe('full (js-prop-types)', () => {
		describe('shorthand :: typed(fcn, type.number, type.number, ...)', () => {
			let addShorthand;
			let addShorthandOptional;

			before(() => {
				// attempt to build
				addShorthand = typedFull(addNumbers, types.number, types.number);
				addShorthandOptional = typedFull(addNumbers, types.number.isOptional, types.number.isOptional);
			});

			it('handles correct param types', () => {
				expect(addShorthand(2, 2)).equal(4);
			});

			it('throws on incorrect param types', () => {
				expect(() => addShorthand(2, '2')).to.throw(/expected an input value of type "number"/);
				expect(() => addShorthand(2, {})).to.throw(/expected an input value of type "number"/);
			});

			it('throws on missing params', () => {
				expect(() => addShorthand()).to.throw(/expected a required input value/);
				expect(() => addShorthand(2)).to.throw(/expected a required input value/);
			});

			it('handles missing params (when isOptional is specified)', () => {
				expect(() => addShorthandOptional(1)).to.not.throw();
				expect(() => addShorthandOptional()).to.not.throw();
			});
		});

		describe('longhand :: typed(fcn, [type.number, type.number, ...], type.number)', () => {
			let addLonghandWithoutResolve;
			let addLonghandWithoutResolveOptional;
			let addLonghandWithResolve;
			let addLonghandBrokenWithResolve;

			before(() => {
				// attempt to build
				addLonghandWithoutResolve = typedFull(addNumbers, [types.number, types.number]);
				addLonghandWithoutResolveOptional = typedFull(addNumbers, [types.number.isOptional, types.number.isOptional]);
				addLonghandWithResolve = typedFull(addNumbers, [types.number, types.number], types.number);
				addLonghandBrokenWithResolve = typedFull(addNumbersBroken, [types.number, types.number], types.number);
			});

			it('handles correct types', () => {
				expect(addLonghandWithoutResolve(2, 2)).equal(4);
			});

			it('throws on incorrect param types', () => {
				expect(() => addLonghandWithoutResolve(2, '2')).to.throw(/expected an input value of type "number"/);
				expect(() => addLonghandWithoutResolve(2, {})).to.throw(/expected an input value of type "number"/);
			});

			it('throws on missing params', () => {
				expect(() => addLonghandWithoutResolve()).to.throw(/expected a required input value/);
				expect(() => addLonghandWithoutResolve(2)).to.throw(/expected a required input value/);
			});

			it('handles missing params (when isOptional is specified)', () => {
				expect(() => addLonghandWithoutResolveOptional(1)).to.not.throw();
				expect(() => addLonghandWithoutResolveOptional()).to.not.throw();
			});

			it('handles return when resolve type is expected', () => {
				expect(addLonghandWithResolve(2, 2)).equal(4);
			});

			it('throws on broken resolve type', () => {
				expect(() => addLonghandBrokenWithResolve(2, 2)).to.throw(/expected a return value of type/);
			});
		});
	});

	describe('basic (lodash-based)', () => {
		describe("shorthand :: typed(fcn, 'isNumber', 'isNumber', ...)", () => {
			let addShorthand;

			before(() => {
				// attempt to build
				addShorthand = typedBasic(addNumbers, 'isNumber', 'isNumber');
			});

			it('handles correct param types', () => {
				expect(addShorthand(2, 2)).equal(4);
			});

			it('throws on incorrect param types', () => {
				expect(() => addShorthand(2, '2')).to.throw(/expected a value of type matching/);
				expect(() => addShorthand(2, {})).to.throw(/expected a value of type matching/);
			});

			it('throws on missing params', () => {
				expect(() => addShorthand()).to.throw(/expected a value of type matching/);
				expect(() => addShorthand(2)).to.throw(/expected a value of type matching/);
			});
		});

		describe("longhand :: typed(fcn, ['isNumber', 'isNumber'], 'isNumber')", () => {
			let addLonghandWithoutResolve;
			let addLonghandWithResolve;
			let addLonghandBrokenWithResolve;

			before(() => {
				// attempt to build
				addLonghandWithoutResolve = typedBasic(addNumbers, ['isNumber', 'isNumber']);
				addLonghandWithResolve = typedBasic(addNumbers, ['isNumber', 'isNumber'], 'isNumber');
				addLonghandBrokenWithResolve = typedBasic(addNumbersBroken, ['isNumber', 'isNumber'], 'isNumber');
			});

			it('handles correct param types', () => {
				expect(addLonghandWithoutResolve(2, 2)).equal(4);
			});

			it('throws on incorrect param types', () => {
				expect(() => addLonghandWithoutResolve(2, '2')).to.throw(/expected a value of type matching/);
				expect(() => addLonghandWithoutResolve(2, {})).to.throw(/expected a value of type matching/);
			});

			it('throws on missing params', () => {
				expect(() => addLonghandWithoutResolve()).to.throw(/expected a value of type matching/);
				expect(() => addLonghandWithoutResolve(2)).to.throw(/expected a value of type matching/);
			});

			it('handles return when resolve type is expected', () => {
				expect(addLonghandWithResolve(2, 2)).equal(4);
			});

			it('throws on broken resolve type', () => {
				expect(() => addLonghandBrokenWithResolve(2, 2)).to.throw(/expected to return value of type/);
			});
		});
	});
});

describe('type checking', () => {
	// TODO: this... someday... this is going to take quite a while
});
