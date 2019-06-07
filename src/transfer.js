/* @flow */

import { TYPE_ERROR } from './constants';

export function serialize(item: any) {
  if (item instanceof Error) {
    // Since we cannot send the error object, we send necessary info to recreate it
    return {
      type: TYPE_ERROR,
      name: item.constructor.name,
      message: item.message,
      stack: item.stack,
    };
  }

  return item;
}

export function deserialize(item: any) {
  if (item != null && item.type === TYPE_ERROR) {
    // Try to get the global object
    const g =
      // DOM environment in browsers
      typeof window !== 'undefined'
        ? window
        : // Web worker environment
        typeof self !== 'undefined'
        ? self
        : //Node environment
        typeof global !== 'undefined'
        ? // eslint-disable-next-line no-undef
          global
        : null;

    const { name, message, stack } = item;

    // If the error was for current action, reject the promise
    // Try to preserve the error constructor, e.g. TypeError
    const ErrorConstructor = g && g[name] ? g[name] : Error;

    const error = new ErrorConstructor(message);

    // Preserve the error stack
    error.stack = stack;

    return error;
  }

  return item;
}
