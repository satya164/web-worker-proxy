/* @flow */

import { TYPE_PERSISTED_FUNCTION, MESSAGE_DISPOSED_ERROR } from './constants';

/**
 * Persist a callback function so it can be called multiple times
 */
export default function persist<T: *>(func: (...args: T) => mixed) {
  const listeners = [];

  let disposed = false;

  return {
    type: TYPE_PERSISTED_FUNCTION,
    apply: (that: *, args: T) => {
      if (disposed) {
        throw new Error(MESSAGE_DISPOSED_ERROR);
      }

      return func.apply(that, args);
    },
    dispose() {
      listeners.forEach(listener => listener());
      disposed = true;
    },
    on(name: 'dispose', cb: Function) {
      if (name === 'dispose') {
        listeners.push(cb);
      }
    },
    get disposed() {
      return disposed;
    },
  };
}
