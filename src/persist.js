/* @flow */

import { TYPE_PERSISTED_FUNCTION, MESSAGE_DISPOSED_ERROR } from './constants';

/**
 * Persist a callback function so it can be called multiple times
 */
export default function persist(func: Function) {
  const listeners = [];

  let disposed = false;

  return {
    type: TYPE_PERSISTED_FUNCTION,
    apply: (...args: *) => {
      if (disposed) {
        throw new Error(MESSAGE_DISPOSED_ERROR);
      }

      func(...args);
    },
    dispose() {
      listeners.forEach(listener => listener());
      disposed = true;
    },
    on(name: 'dispose', cb: Function) {
      listeners.push(cb);
    },
    get disposed() {
      return disposed;
    },
  };
}
