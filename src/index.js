/* @flow */

import { generate } from 'shortid';

type Source = {
  +addEventListener: (name: 'message', cb: (e: any) => mixed) => mixed,
  +removeEventListener: (name: 'message', cb: (e: any) => mixed) => mixed,
  +postMessage: (data: mixed) => mixed,
};

type Target = {
  +postMessage: (data: mixed) => mixed,
};

const ACTION_GET = '__$$__SUPER_WORKER__ACTION_GET';
const ACTION_SET = '__$$__SUPER_WORKER__ACTION_SET';
const ACTION_CALL = '__$$__SUPER_WORKER__ACTION_CALL';

const RESULT_SUCCESS = '__$$__SUPER_WORKER__RESULT_SUCCESS';
const RESULT_ERROR = '__$$__SUPER_WORKER__RESULT_ERROR';

/**
 * Creates a proxied web worker.
 * This should be called in the DOM context.
 */
export function create(worker: Source): any {
  // Create an empty object to be proxied
  // We don't actually proxy the worker instance
  const o = Object.create(null);

  // Send actions to the worker and wait for result
  const send = (type, data) =>
    new Promise((resolve, reject) => {
      // Unique id to identify the current action
      const id = generate();

      // Listener to handle incoming messages from the worker
      const listener = e => {
        switch (e.data.type) {
          case RESULT_SUCCESS:
            if (e.data.id === id) {
              // If the success result was for current action, resolve the promise
              resolve(e.data.result);
              removeListener();
            }

            break;

          case RESULT_ERROR:
            if (e.data.id === id) {
              // If the error was for current action, reject the promise
              // Try to preserve the error constructor, e.g. TypeError
              const ErrorConstructor =
                window[e.data.error.constructor] || Error;
              const error = new ErrorConstructor(e.data.error.message);

              // Preserve the error stack
              error.stack = e.data.error.stack;

              reject(error);
              removeListener();
            }

            break;
        }
      };

      const removeListener = () =>
        worker.removeEventListener('message', listener);

      worker.addEventListener('message', listener);
      worker.postMessage({ type, id, data });
    });

  // Return a proxied object on which actions can be performed
  return new Proxy(o, {
    get(target, key) {
      const func = (...args) =>
        // It's a function call
        send(ACTION_CALL, { key, args });

      // We execute the promise lazily and cache it here to avoid calling again
      let promise;

      const then = (succes, error) => {
        if (!promise) {
          // If the cached promise doesn't exist, create a new promise and cache it
          promise = send(ACTION_GET, { key }).then(succes, error);
        }

        return promise;
      };

      // Here we intercept both function calls and property access
      // To intercept function calls, we return a function with `then` and `catch` methods
      // This makes sure that the result can be used like a promise in case it's a property access
      func.then = then;
      func.catch = error => then(null, error);

      return func;
    },
    set(target, key, value) {
      // Trigger setting the key
      // This might fail, but we can't throw an error synchornously
      // In case of a failure, the promise will be rejected and the browser will throw an error
      // If setting the property fails silently in the worker, this will also fail silently
      send(ACTION_SET, { key, value });

      // We can't know if set will succeed synchronously
      // So we always return true
      return true;
    },
  });
}

/**
 * Proxies an object inside an worker.
 * This should be called inside an worker.
 */
export function proxy(o: Object, target?: Target = self) {
  // Create an error response
  // Since we cannot send the error object, we send necessary info to recreate it
  const error = e => ({
    constructor: e.constructor.name,
    message: e.message,
    stack: e.stack,
  });

  // Listen to messages from the client
  const listener = e => {
    switch (e.data.type) {
      case ACTION_GET:
      case ACTION_SET:
      case ACTION_CALL: {
        const { id, data } = e.data;

        try {
          let result;

          if (e.data.type === ACTION_SET) {
            // When setting the value, use Reflect.set, so we get success/failure status
            result = Reflect.set(o, data.key, data.value);
          } else {
            const prop = o[data.key];

            if (e.data.type === ACTION_CALL) {
              if (typeof prop !== 'function') {
                throw new TypeError(`${data.key} is not a function`);
              } else {
                result = prop(...data.args);
              }
            } else {
              result = prop;
            }
          }

          // If result is a thenable, resolve the result before sending
          // This allows us to support results which are promise-like
          /* $FlowFixMe */
          if (result && typeof result.then === 'function') {
            Promise.resolve(result).then(
              r => target.postMessage({ type: RESULT_SUCCESS, id, result: r }),
              e =>
                target.postMessage({
                  type: RESULT_ERROR,
                  id,
                  error: error(e),
                })
            );
          } else {
            target.postMessage({ type: RESULT_SUCCESS, id, result });
          }
        } catch (e) {
          target.postMessage({
            type: RESULT_ERROR,
            id,
            error: error(e),
          });
        }

        break;
      }
    }
  };

  self.addEventListener('message', listener);

  return {
    // Return a method to dispose the proxy
    // Disposing will remove the listeners and the proxy will stop working
    dispose: () => self.removeEventListener('message', listener),
  };
}
