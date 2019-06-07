/* @flow */

import { TYPE_PERSISTED_FUNCTION, MESSAGE_DISPOSED_ERROR } from './constants';

/**
 * Persist a callback function so it can be called multiple times
 */
export default function persist(func: (...args: any) => mixed) {
  const listeners = [];

  let disposed = false;

  return {
    type: TYPE_PERSISTED_FUNCTION,
    apply: (that: *, args: any) => {
      if (disposed) {
        throw new Error(MESSAGE_DISPOSED_ERROR);
      }

      return func.apply(that, args);
    },
    dispose() {
      listeners.forEach(listener => listener());
      disposed = true;
    },
    on(name: 'dispose', cb: () => mixed) {
      if (name === 'dispose') {
        listeners.push(cb);
      }
    },
    get disposed() {
      return disposed;
    },
  };
}
