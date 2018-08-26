/* @flow */
/* eslint-env node */

import { create, proxy, persist } from '../index';
import WorkerMock from './__utils__/WorkerMock';

const worker = create(
  new WorkerMock(self => {
    proxy(
      {
        name: 'John Doe',

        fruits: ['orange', 'banana'],

        show: { name: 'Star Wars', genre: 'SciFi' },

        whoa: new Error('Wait what?'),

        methods: {
          add: (a, b) => {
            if (typeof a === 'number' && typeof b === 'number') {
              return a + b;
            }

            return new TypeError('Both arguments should be numbers');
          },

          timeout: (duration, error) =>
            new Promise((resolve, reject) =>
              setTimeout(
                () =>
                  error
                    ? reject(new Error("Can't do this anymore"))
                    : resolve('Hello there'),
                duration
              )
            ),

          throw() {
            throw new TypeError('This is not right');
          },

          error(error, promise) {
            if (error instanceof Error) {
              if (promise) {
                return Promise.resolve(error);
              }

              return error;
            }
          },

          callback(cb, count = 1) {
            if (typeof count !== 'number') {
              cb(new TypeError('Count must be a number'));
              return;
            }

            for (let i = 0; i < count; i++) {
              cb({ foo: 'bar', index: i });
            }
          },
        },
      },
      self
    );
  })
);

it('accesses serializable properties', async () => {
  expect.assertions(4);

  expect(await worker.name).toBe('John Doe');
  expect(await worker.fruits).toEqual(['orange', 'banana']);
  expect(await worker.show).toEqual({ name: 'Star Wars', genre: 'SciFi' });
  expect(await worker.whoa).toEqual(new Error('Wait what?'));
});

it('accesses nested properties', async () => {
  expect.assertions(2);

  expect(await worker.show.genre).toEqual('SciFi');
  expect(await worker.fruits[1]).toEqual('banana');
});

it('gets result from synchronous function', async () => {
  expect.assertions(2);

  expect(await worker.methods.add(3, 7)).toBe(10);
  expect(await worker.methods.add()).toEqual(
    new TypeError('Both arguments should be numbers')
  );
});

it('gets result from async function', async () => {
  expect.assertions(2);

  expect(await worker.methods.timeout(0)).toBe('Hello there');

  try {
    await worker.methods.timeout(0, true);
  } catch (e) {
    expect(e.message).toBe("Can't do this anymore");
  }
});

it('catches thrown errors', async () => {
  expect.assertions(1);

  try {
    await worker.methods.throw();
  } catch (e) {
    expect(e).toEqual(new TypeError('This is not right'));
  }
});

it('passes error object to worker and receives error object', async () => {
  expect.assertions(2);

  expect(await worker.methods.error(new TypeError('Something is up'))).toEqual(
    new TypeError('Something is up')
  );
  expect(
    await worker.methods.error(new TypeError('Something is up'), true)
  ).toEqual(new TypeError('Something is up'));
});

it('sets values', async () => {
  expect.assertions(3);

  expect(await worker.foo).toBe(undefined);

  worker.foo = {};
  worker.foo.baz = 42;

  expect(await worker.foo.baz).toBe(42);

  worker.foo.bax = new SyntaxError('Invalid functionz');

  expect(await worker.foo.bax).toEqual(new SyntaxError('Invalid functionz'));
});

it('is able to await a promise multiple times', async () => {
  expect.assertions(4);

  const name = worker.name;

  expect(await name).toBe('John Doe');
  expect(await name).toBe('John Doe');

  const error = worker.methods.throw();

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
  expect.assertions(2);

  worker.methods.callback(result => {
    expect(result).toEqual({ foo: 'bar', index: 0 });

    worker.methods.callback(result => {
      expect(result).toEqual(new TypeError('Count must be a number'));
      done();
    }, '4');
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

  worker.methods.callback(callback, 3);
});
