/* @flow */

import { proxy } from '../src/index';

proxy({
  name: { first: 'John', last: 'Smith' },
  add(a, b) {
    return a + b;
  },
  error() {
    throw new TypeError('This is an error');
  },
});
