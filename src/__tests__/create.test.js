/* @flow */

import create from '../create';
import { RESULT_SUCCESS, RESULT_ERROR } from '../constants';

it('removes listener after successful operation', async () => {
  expect.assertions(4);

  let listener;

  const postMessage = (data: any) =>
    setTimeout(() =>
      listener({ data: { type: RESULT_SUCCESS, id: data.id, result: 42 } })
    );
  const addEventListener = (name, cb) => {
    expect(name).toBe('message');
    expect(listener).toBe(undefined);
    listener = cb;
  };
  const removeEventListener = (name, cb) => {
    expect(name).toBe('message');
    expect(listener).toBe(cb);
  };

  const worker = create({
    postMessage,
    addEventListener,
    removeEventListener,
  });

  await worker.foo.bar;
});

it('removes listener after error', async () => {
  expect.assertions(4);

  let listener;

  const postMessage = (data: any) =>
    setTimeout(() =>
      listener({
        data: {
          type: RESULT_ERROR,
          id: data.id,
          error: { name: 'Error', message: '', stack: '' },
        },
      })
    );
  const addEventListener = (name, cb) => {
    expect(name).toBe('message');
    expect(listener).toBe(undefined);
    listener = cb;
  };
  const removeEventListener = (name, cb) => {
    expect(name).toBe('message');
    expect(listener).toBe(cb);
  };

  const worker = create({
    postMessage,
    addEventListener,
    removeEventListener,
  });

  try {
    await worker.foo.bar;
  } catch (e) {
    // ignore
  }
});
