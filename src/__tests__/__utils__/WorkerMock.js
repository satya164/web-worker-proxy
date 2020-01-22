/* @flow */
/* eslint-env node */
/* istanbul ignore file */

import clone from 'structured-clone';
import type { Target } from '../../types';

type Callback = (self: Target) => mixed;

const createScope = onMessage => {
  const listeners = [];

  return {
    self: {
      postMessage(data) {
        setImmediate(() => onMessage(clone(data)));
      },
      addEventListener(name: 'message', listener) {
        listeners.push(listener);
      },
      removeEventListener(name: 'message', listener) {
        const index = listeners.indexOf(listener);

        if (index > -1) {
          listeners.splice(index, 1);
        }
      },
    },
    notify(data) {
      listeners.forEach(listener => listener({ type: 'message', data }));
    },
  };
};

export default function WorkerMock(callback: Callback): Target {
  const workerScope = createScope(data => clientScope.notify(data));
  const clientScope = createScope(data => workerScope.notify(data));

  callback(workerScope.self);

  return clientScope.self;
}
