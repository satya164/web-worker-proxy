/* @flow */

import intercept from './intercept';
import uid from './uid';
import { serialize, deserialize } from './transfer';
import {
  ACTION_OPERATION,
  ACTION_DISPOSE,
  RESULT_SUCCESS,
  RESULT_ERROR,
  RESULT_CALLBACK,
  TYPE_FUNCTION,
  TYPE_PERSISTED_FUNCTION,
} from './constants';
import type { Worker } from './types';

/**
 * Creates a proxied web worker.
 * This should be called in the DOM context.
 */
export default function create(worker: Worker): any {
  // Send actions to the worker and wait for result
  const send = (type, data) =>
    new Promise((resolve, reject) => {
      // Unique id to identify the current action
      const id = uid();

      // For function calls, store any callbacks we're sending
      const callbacks = new Map();

      // Store a variable to indicate whether the task has been fulfilled
      let fulfilled = false;

      if (type === ACTION_OPERATION) {
        const last = data[data.length - 1];

        if (last.type === 'apply') {
          // If we have a function call, map callbacks in the function call to refs
          /* $FlowFixMe */
          last.args = last.args.map(arg => {
            // If the argument is a callback function, we create a ref and store the function
            // We also replace the argument with the ref instead
            // Otherwise we just return it
            if (typeof arg === 'function') {
              const ref = uid();
              callbacks.set(ref, arg);
              return {
                type: TYPE_FUNCTION,
                ref,
              };
            }

            // Persisted functions are like normal functions, but can be called multiple times
            // We clean it up only when the user disposes it
            if (arg != null && arg.type === TYPE_PERSISTED_FUNCTION) {
              const ref = uid();
              callbacks.set(ref, arg);

              // Add a listener to the persisted function to listen for dispose
              // When the function is disposed, we delete it and remove the listeners
              // We also notify the worker that this function is disposed and can no longer be called
              arg.on('dispose', () => {
                callbacks.delete(ref);
                removeListener();

                worker.postMessage({
                  type: ACTION_DISPOSE,
                  ref,
                });
              });

              return {
                type: TYPE_FUNCTION,
                ref,
                persisted: true,
              };
            }

            return serialize(arg);
          });
        } else if (last.type === 'set') {
          last.value = serialize(last.value);
        }
      }

      // Listener to handle incoming messages from the worker
      const listener = e => {
        switch (e.data.type) {
          case RESULT_SUCCESS:
            if (e.data.id === id) {
              // If the success result was for current action, resolve the promise
              resolve(deserialize(e.data.result));

              fulfilled = true;

              removeListener();
            }

            break;

          case RESULT_ERROR:
            if (e.data.id === id) {
              reject(deserialize(e.data.error));

              fulfilled = true;

              removeListener();
            }

            break;

          case RESULT_CALLBACK:
            if (e.data.id === id) {
              // Get the referenced callback
              const { ref, args } = e.data.func;
              const callback = callbacks.get(ref);

              if (callback) {
                callback.apply(null, args.map(deserialize));

                if (callback.type !== TYPE_PERSISTED_FUNCTION) {
                  // Remove the callback if it's not persisted
                  callbacks.delete(ref);
                }
              } else {
                // Function is already disposed
                // This shouldn't happen
              }

              removeListener();
            }
        }
      };

      const removeListener = () => {
        if (callbacks.size === 0 && fulfilled) {
          // Remove the listener once there are no callbacks left and task is fulfilled
          worker.removeEventListener('message', listener);
        }
      };

      worker.addEventListener('message', listener);
      worker.postMessage({ type, id, data });
    });

  return intercept(operations => send(ACTION_OPERATION, operations));
}
