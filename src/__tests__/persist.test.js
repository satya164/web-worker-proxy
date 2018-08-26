/* @flow */

import persist from '../persist';
import { MESSAGE_DISPOSED_ERROR } from '../constants';

it('returns an object for persisting the function', () => {
  const func = jest.fn();
  const callback = persist(func);

  expect(callback.disposed).toBe(false);

  callback.apply(null, [42]);

  expect(func).toHaveBeenCalledWith(42);
});

it('calls dispose listeners after disposing', () => {
  const listener = jest.fn();
  const callback = persist(jest.fn());

  callback.on('dispose', listener);
  callback.dispose();

  expect(listener).toHaveBeenCalled();
  expect(callback.disposed).toBe(true);
});

it('throws error when called disposing', () => {
  const callback = persist(jest.fn());

  callback.dispose();

  expect(callback.disposed).toBe(true);
  expect(() => callback.apply()).toThrowError(MESSAGE_DISPOSED_ERROR);
});
