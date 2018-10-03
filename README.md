# Typed

**Simplistic and minimal runtime type checking system for Node.js applications.**

[![Build Status](https://travis-ci.org/flynnham/typed.svg?branch=master)](https://travis-ci.org/flynnham/typed)
[![npm](https://img.shields.io/npm/v/@o3/typed.svg)](https://www.npmjs.com/package/@o3/typed)
[![dependencies Status](https://david-dm.org/flynnham/typed/status.svg)](https://david-dm.org/flynnham/typed)
[![devDependencies Status](https://david-dm.org/flynnham/typed/dev-status.svg)](https://david-dm.org/flynnham/typed?type=dev)
[![peerDependencies Status](https://david-dm.org/flynnham/typed/peer-status.svg)](https://david-dm.org/flynnham/typed?type=peer)

Typed is a minimal wrapper based type checking library for JavaScript to ensure user/developer facing functions are passed (and also return) their expected types. This is done in an attempt to reduce the amount human error in runtime environments.

## Installing

### via npm
```bash
npm i -S @o3/typed
# For fully featured runtime checking also install:
npm i -S @o3/prop-types
```

## How to use

### Shared syntax pattern

You can define a subset of functions to accept ambiguous
arguments like so:

```js
// define your base library and/or utility functions
const add = (x, y) => x + y
const addOptional = (x, y = 3) => x + y;
```

And then wrap them using the typed functionality.

Allowing you to restrict your public functions to only accept
specific input types and throw type errors when improper values
are provided

```js
const typed = ('@o3/typed/full');

module.exports = {
    // first two arguments must be string
    concat: typed(add, typed.string, typed.string)
    // first two arguments must be number
    addNumbers: typed(add, typed.number, typed.number),
    // first argument must be a number, while second can be ommited
    // but is passed must be a number
    addThree: typed(add, typed.number, typed.number.isOptional),
};
```

> NOTE: **typed/full** uses a dependency called
**[js-prop-types](https://github.com/flynnham/js-prop-types)**, which
needs to be installed as a peer dependency. A more minimal
version is exported at root level, which does not require this
dependency, and instead opts to use a minimized lodash type build.

Using a alternative syntax, it is also possible to specify an expected
resolving (return) type for a given function. For more complex functions
this will ensure that input error won't return any unwanted inputs.

```js
function complexAdd(x, y) {
    if (x === 0) {
    // zero sucks so let's do something awful
        // mostly for demonstrative purposes, I don't recommended writing
        // any production code like this ;)
        return null
    }

    // return forced integer add (base10)
    return parseInt(x, 10) + parseInt(y, 10);
}

// create (string or number) type to use in our definition
const stringOrNumber = typed.oneOfType([
    typed.string,
    typed.number,
]);

const addOnlyReturnNumber = typed(complexAdd, [
    // first and second param can be either a number or string
    stringOrNumber, stringOrNumber,
    // but must return a number
], typed.number);

addOnlyReturnNumber(2, 2) // returns expected type number (4)
addOnlyReturnNumber('2', 2) // returns expected type number (4)
addOnlyReturnNumber(0, 2) // throws due to invalid return value 'null'

```
### Full format (recommended)

All the above examples are written in the full syntax, which requires the
additional single dependency of
[js-prop-types](https://github.com/flynnham/js-prop-types), an adaptation of the Facebook
React prop-types library. A more detailed write up of accepted syntax will
come eventually, but I highly recommend you stick with [their official
documentation here](https://github.com/facebook/prop-types/blob/master/README.md).

The modifications made remove unneeded support for React components,
add enforced `isRequired` on all known type definitions. To opt out of this,
passing `types.typeName.isOptional` will allow voided values to be passed.


### Basic format (minimal, no dependencies required)

While I'm making progress to reduce the amount of redundant abstractions within
the [js-prop-types](https://github.com/flynnham/js-prop-types) library, by default
this library exports a minimal version of the shown syntax, which relies on a
minimized and tree-shaken port of all of [lodash](https://lodash.com/)'s known
`is{Type}` exports.

The benefits of using this syntax are more strict type checking (verses
[js-prop-types](https://github.com/flynnham/js-prop-types))
needing to rely on primitive checking that can sometimes be prone to strange quirks.
The downside is that optional arguments are not really well supported due to it's
highly strict nature.

**Here is an example of the alternative basic format:**

#### Example

```js
const typed = require('@o3/typed');

const add = (x, y) => x + y

// ensure first two paramaters meet expectation isNumber
// shorthand syntax
const addNumbers = typed(add, 'isNumber', 'isNumber');

// ensure that the parameter passed meets either expectation
const numberOrString = {
    anyOf: ['isNumber', 'isString'],
};

// longhand syntax
const addOnlyReturnNumber = typed(add, [numberOrString, numberOrString], 'isNumber');
```
## Why make this

While searching the Internet for a solution to a problem I needed solving, I kept
finding dynamic typing systems like TypeScript and Flow.

While these tools are great for ensuring that your internal code isn't calling any
other code incorrectly, **they don't seem to be orientated towards ensuring type
compliance at runtime, which is an issue when allowing external developers to
interface with your code.**

I was also able to find several Babel runtime plug-ins that, to be frank,
did not even meet the most minimal of my own expectations. I was underwhelmed
by the quality of the runtime type-checking, since it seemed that the plugins
would haphazardly enforce shallow type checking on **all methods** that included
definitions, which in the case of Flow and TypeScript would be most methods within
the codebase.

Performance wise this is not good as it adds at least several additional calls to
**every** function invocation, which compounds quickly). Additionally, it also adds
unneeded points of failure to each function call that was injected.

The solution employed by this library is intended to be applied to developer
and user facing methods and calls, since those functions are most prone to input
error, and should be the only functions (in a language like JavaScript) that
realistically need runtime type checking.
