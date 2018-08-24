/* @flow */
/* eslint-env node */

import { create, proxy, persist } from '../src/index';
import WorkerMock from './__utils__/WorkerMock';

const worker = create(
  new WorkerMock(self => {
    proxy(
      {
        name: 'John Doe',

        fruits: ['orange', 'banana'],

        add: (a, b) => a + b,

        timeout: duration =>
          new Promise(resolve =>
            setTimeout(() => resolve('Hello there'), duration)
          ),

        error() {
          throw new TypeError('This is not right');
        },

        callback(cb, count = 1) {
          for (let i = 0; i < count; i++) {
            cb({ foo: 'bar', index: i });
          }
        },
      },
      self
    );
  })
);

it('accesses serializable properties', async () => {
  expect.assertions(2);

  expect(await worker.name).toBe('John Doe');
  expect(await worker.fruits).toEqual(['orange', 'banana']);
});

it('gets result from synchronous function', async () => {
  expect.assertions(1);

  expect(await worker.add(3, 7)).toBe(10);
});

it('gets result from async function', async () => {
  expect.assertions(1);

  expect(await worker.timeout(0)).toBe('Hello there');
});

it('catches thrown errors', async () => {
  expect.assertions(1);

  try {
    await worker.error();
  } catch (e) {
    expect(e).toEqual(new TypeError('This is not right'));
  }
});

it('sets values', async () => {
  expect.assertions(2);

  expect(await worker.foo).toBe(undefined);

  worker.foo = 42;

  expect(await worker.foo).toBe(42);
});

it('is able to await a promise multiple times', async () => {
  expect.assertions(4);

  const name = worker.name;

  expect(await name).toBe('John Doe');
  expect(await name).toBe('John Doe');

  const error = worker.error();

  try {
    await error;
  } catch (e) {
    expect(e).toEqual(new TypeError('This is not right'));
  }

  try {
    await error;
  } catch (e) {
    expect(e).toEqual(new TypeError('This is not right'));
  }
});

it('executes simple callback', done => {
  expect.assertions(1);

  worker.callback(result => {
    expect(result).toEqual({ foo: 'bar', index: 0 });
    done();
  });
});

it('executes persisted callback multiple times', done => {
  expect.assertions(3);

  const callback = persist(result => {
    if (result.index === 0) {
      expect(result).toEqual({ foo: 'bar', index: 0 });
    } else if (result.index === 1) {
      expect(result).toEqual({ foo: 'bar', index: 1 });
    } else {
      expect(result).toEqual({ foo: 'bar', index: 2 });
      callback.dispose();
      done();
    }
  });

  worker.callback(callback, 3);
});
