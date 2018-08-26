/* @flow */

import { proxy } from '../src/index';

proxy({
  name: 'John Doe',

  fruits: ['orange', 'banana'],

  show: { name: 'Star Wars', genre: 'SciFi' },

  add: (a, b) => a + b,

  timeout: duration =>
    new Promise(resolve => setTimeout(() => resolve('Hello there'), duration)),

  throw() {
    throw new TypeError('This is not right');
  },

  callback(cb, count = 1) {
    for (let i = 0; i < count; i++) {
      cb({ foo: 'bar', index: i });
    }
  },
});
