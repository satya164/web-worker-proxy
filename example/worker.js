/* @flow */

import { proxy } from '../src/index';

proxy({
  name: 'John Doe',

  add: (a, b) => a + b,

  timeout: duration =>
    new Promise(resolve => setTimeout(() => resolve('Hello there'), duration)),

  error() {
    throw new TypeError('This is not right');
  },
});
