/* @flow */

import {
  ACTION_OPERATION,
  ACTION_DISPOSE,
  RESULT_SUCCESS,
  RESULT_ERROR,
  RESULT_CALLBACK,
  TYPE_FUNCTION,
  MESSAGE_DISPOSED_ERROR,
} from './constants';
import { serialize, deserialize } from './transfer';
import type { Worker } from './types';

const proxies = new WeakMap();

/**
 * Proxies an object inside an worker.
 * This should be called inside an worker.
 */
export default function proxy(o: Object, target?: Worker = self) {
  if (proxies.has(target)) {
    throw new Error(
      'The specified target already has a proxy. To create a new proxy, call `dispose` first to dispose the previous proxy.'
    );
  }

  proxies.set(target, true);

  // List of persisted function refs
  const persisted = [];

  // Listen to messages from the client
  const listener = (e: any) => {
    switch (e.data.type) {
      case ACTION_OPERATION:
        {
          const { id, data } = e.data;

          try {
            let result: any = o;

            for (const action of data) {
              if (action.type === 'get') {
                result = result[action.key];
              } else if (action.type === 'set') {
                // Reflect.set will return a boolean to indicate if setting the property was successful
                // Setting the property might fail if the object is read only
                result = Reflect.set(
                  result,
                  action.key,
                  deserialize(action.value)
                );
              } else if (action.type === 'apply') {
                const prop = result[action.key];

                if (typeof prop !== 'function') {
                  throw new TypeError(`${action.key} is not a function`);
                } else {
                  result = prop(
                    // Loop through the results to find if there are callback functions
                    ...action.args.map(arg => {
                      if (arg != null && arg.type === TYPE_FUNCTION) {
                        // If we find a ref for a function, replace it with a custom function
                        // This function can notify the parent when it receives arguments
                        return (() => {
                          let called = false;

                          if (arg.persisted) {
                            // If the function is persisted, add it to the persisted list
                            persisted.push(arg.ref);
                          }

                          return (...params) => {
                            if (called && !persisted.includes(arg.ref)) {
                              // If function was called before and is no longer persisted, don't send results back
                              throw new Error(MESSAGE_DISPOSED_ERROR);
                            }

                            called = true;
                            target.postMessage({
                              type: RESULT_CALLBACK,
                              id,
                              func: {
                                args: params.map(serialize),
                                ref: arg.ref,
                              },
                            });
                          };
                        })();
                      }

                      return deserialize(arg);
                    })
                  );
                }
              } else {
                throw new Error(`Unsupported operation "${action.type}"`);
              }
            }

            // If result is a thenable, resolve the result before sending
            // This allows us to support results which are promise-like
            /* $FlowFixMe */
            if (result && typeof result.then === 'function') {
              Promise.resolve(result).then(
                r =>
                  target.postMessage({
                    type: RESULT_SUCCESS,
                    id,
                    result: serialize(r),
                  }),
                e =>
                  target.postMessage({
                    type: RESULT_ERROR,
                    id,
                    error: serialize(e),
                  })
              );
            } else {
              target.postMessage({
                type: RESULT_SUCCESS,
                id,
                result: serialize(result),
              });
            }
          } catch (e) {
            target.postMessage({
              type: RESULT_ERROR,
              id,
              error: serialize(e),
            });
          }
        }

        break;

      case ACTION_DISPOSE:
        {
          // Remove the callback ref from persisted list when it's disposed
          const index = persisted.indexOf(e.data.ref);

          if (index > -1) {
            persisted.splice(index, 1);
          }
        }

        break;
    }
  };

  target.addEventListener('message', listener);

  return {
    // Return a method to dispose the proxy
    // Disposing will remove the listeners and the proxy will stop working
    dispose: () => {
      target.removeEventListener('message', listener);
      proxies.delete(target);
    },
  };
}
