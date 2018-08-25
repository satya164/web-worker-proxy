/* @flow */

import proxy from '../proxy';
import {
  ACTION_OPERATION,
  ACTION_DISPOSE,
  TYPE_FUNCTION,
  RESULT_SUCCESS,
  RESULT_ERROR,
  RESULT_CALLBACK,
  MESSAGE_DISPOSED_ERROR,
} from '../constants';

it('throws error when called again with same target', () => {
  const target = {
    postMessage: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  proxy({}, target);

  expect(() => {
    proxy({}, target);
  }).toThrowError('The specified target already has a proxy.');
});

it('disposes proxied object when calling dispose', () => {
  const postMessage = jest.fn();
  const addEventListener = jest.fn();
  const removeEventListener = jest.fn();

  const proxied = proxy(
    {},
    {
      postMessage,
      addEventListener,
      removeEventListener,
    }
  );

  expect(addEventListener).toHaveBeenCalled();
  expect(addEventListener.mock.calls[0][0]).toBe('message');
  expect(typeof addEventListener.mock.calls[0][1]).toBe('function');

  expect(removeEventListener).not.toHaveBeenCalled();

  proxied.dispose();

  expect(removeEventListener).toHaveBeenCalled();
  expect(removeEventListener.mock.calls[0][0]).toBe('message');
  expect(typeof removeEventListener.mock.calls[0][1]).toBe('function');
});

it('throws error when doing unsupported operation', () => {
  let listener: any = null;

  const postMessage = jest.fn();
  const addEventListener = (name, cb) => {
    listener = cb;
  };
  const removeEventListener = jest.fn();

  proxy(
    {},
    {
      postMessage,
      addEventListener,
      removeEventListener,
    }
  );

  listener({
    data: {
      type: ACTION_OPERATION,
      id: '1',
      data: [{ type: 'something' }],
    },
  });

  const arg: any = postMessage.mock.calls[0][0];

  expect(arg.type).toBe(RESULT_ERROR);
  expect(arg.error.name).toBe('Error');
  expect(arg.error.message).toBe('Unsupported operation "something"');
});

it('throws error when executing non existent function', () => {
  let listener: any = null;

  const postMessage = jest.fn();
  const addEventListener = (name, cb) => {
    listener = cb;
  };
  const removeEventListener = jest.fn();

  proxy(
    {},
    {
      postMessage,
      addEventListener,
      removeEventListener,
    }
  );

  listener({
    data: {
      type: ACTION_OPERATION,
      id: '1',
      data: [
        {
          type: 'apply',
          key: 'foo',
          args: [],
        },
      ],
    },
  });

  const arg: any = postMessage.mock.calls[0][0];

  expect(arg.type).toBe(RESULT_ERROR);
  expect(arg.error.name).toBe('TypeError');
  expect(arg.error.message).toBe('foo is not a function');
});

it('disposes persisted functions', done => {
  let listener: any = null;

  const postMessage = jest.fn();
  const addEventListener = (name, cb) => {
    listener = cb;
  };
  const removeEventListener = jest.fn();

  proxy(
    {
      foo(cb) {
        cb(42);

        setTimeout(() => {
          expect(() => cb()).toThrowError(MESSAGE_DISPOSED_ERROR);
          done();
        }, 1);

        return 'hello world';
      },
    },
    {
      postMessage,
      addEventListener,
      removeEventListener,
    }
  );

  listener({
    data: {
      type: ACTION_OPERATION,
      id: '1',
      data: [
        {
          type: 'apply',
          key: 'foo',
          args: [{ type: TYPE_FUNCTION, ref: '2', persisted: true }],
        },
      ],
    },
  });

  expect(postMessage.mock.calls[0][0]).toEqual({
    type: RESULT_CALLBACK,
    id: '1',
    func: { args: [42], ref: '2' },
  });
  expect(postMessage.mock.calls[1]).toEqual([
    {
      type: RESULT_SUCCESS,
      id: '1',
      result: 'hello world',
    },
  ]);

  listener({
    data: {
      type: ACTION_DISPOSE,
      ref: '2',
    },
  });
});
