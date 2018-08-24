/* @flow */

import { proxy } from '../src/index';

proxy({
  name: 'John Doe',

  fruits: ['orange', 'banana'],

  add: (a, b) => a + b,

  timeout: duration =>
    new Promise(resolve => setTimeout(() => resolve('Hello there'), duration)),

  error() {
    throw new TypeError('This is not right');
  },

  callback(cb, count = 1) {
    for (let i = 0; i < count; i++) {
      cb({ foo: 'bar', index: i });
    }
  },
});
