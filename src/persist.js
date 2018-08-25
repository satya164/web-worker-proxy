/* @flow */

import { TYPE_PERSISTED_FUNCTION } from './constants';

/**
 * Persist a callback function so it can be called multiple times
 */
export default function persist(func: Function) {
  return {
    type: TYPE_PERSISTED_FUNCTION,
    func,
    dispose() {
      this.listeners.forEach(listener => listener());
    },
    listeners: [],
  };
}
