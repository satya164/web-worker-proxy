# web-worker-proxy

[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![MIT License][license-badge]][license]
[![Version][version-badge]][package]
[![Bundle size (minified + gzip)][bundle-size-badge]][bundle-size]

A better way of working with web workers. Uses [JavaScript Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to make communcation with web workers similar to interacting with normal objects.

## Why

Web workers are great to offload work to a different thread in browsers. However, the messaging based API is not very easy to work with. This library makes working with web workers similar to how you'd interact with a local object, thanks to the power of proxies.

## Features

- Access and set properties on the proxied object asynchronously, even nested ones
- Call functions on the proxied object and receive the result asynchronously
- Pass callbacks (limited functionality) to the worker which can be called asynchronously
- Receive thrown errors without extra handling for serialization

## Installation

```sh
npm install web-worker-proxy
```

or

```sh
yarn add web-worker-proxy
```

## Usage

First, we need to wrap our worker to be able to access the proxied object in the worker:

```js
import { create } from 'web-worker-proxy';

const worker = create(new Worker('worker.js'));
```

Inside the web worker, we need to do wrap the target object to proxy it:

```js
import { proxy } from 'web-worker-proxy';

proxy({
  name: { first: 'John', last: 'Doe' },
  add: (a, b) => a + b,
});
```

Now we can access properties, call methods etc. by using the `await` keyword, or passing a callback to `then`:

```js
console.log(await worker.name.first); // 'John'

// or

worker.name.first.then(result => {
  console.log(result); // 'John'
});
```

When accessing a property or calling a function, you'll get `thenable` as the value. It's lazy, so the actual operation doesn't start until you await the value or call `.then` on it.

## Supported operations

### Accessing a property

You can access any serializable properties on the proxied object asynchronously.

```js
// Serializable values
console.log(await worker.name);

// Nested properties
console.log(await worker.name.first);

// Even array indexes
console.log(await worker.items[0]);
```

### Adding or updating a property

You can add a new property on the proxied object, or create a new one. It can be a nested property too.

```js
worker.thisisawesome = true;
```

### Calling methods

You can call methods on the proxied object, and pass any serializable arguments to it. The method will return a promise which will resolve to the value returned in the worker.

The method on the proxied object can return any serializable value or a promise which returns a serializable value. You can also catch errors thrown from it.

```js
try {
  const result = await worker.add(2, 3);
} catch (e) {
  console.log(e);
}
```

It's also possible to pass callbacks to methods, with some limitations:

- The arguments to the callback function must be serializable
- The callback functions are one-way, which means, you cannot return a value from a callback function
- The callback functions must be direct arguments to the method, it cannot be nested inside an object

```js
worker.methods.validate(result => {
  console.log(result);
});
```

To prevent memory leaks, callbacks are cleaned up as soon as they are called. Which means, if your callback is supposed to be called multiple times, it won't work. However, you can persist a callback function for as long as you want with the `persist` helper. Persisting a function keeps around the event listeners. You must call `dispose` once the function is no longer needed so that they can be cleaned up.

```js
import { persist } from 'web-worker-proxy';

const callback = persist(result => {
  if (result.done) {
    callback.dispose();
  } else {
    console.log(result);
  }
});

worker.subscribe(callback);
```

## API

### `create(worker: Worker)`

Create a proxy object which wraps the worker and allows you to interact with the proxied object inside the worker. It can take any object which implements the `postMessage` interface and the event interface (`addEventListener` and `removeListener`).

### `proxy(object: Object, target?: Worker = self)`

Proxy an object so it can be interacted with. The first argument is the object to proxy, and the second argument is an object which implements the `postMessage` interface and the event interface, it defaults to `self`. It returns an object with a `dispose` method to dispose the proxy.

There can be only one proxy active for a given target at a time. To proxy a different object, we first need to dispose the previous proxy first by using the `disposed` method.

### `persist(function: Function)`

Wrap a function so it can be persisted when passed as a callback. Returns an object with a `dispose` method to dispose the persisted function.

## Browser compatibility

The library expects the `Proxy` and `WeakMap` constructors to be available globally. If you are using a browser which doesn't support these features, make sure to load appropriate polyfills.

The following environments support these features natively: Google Chrome >= 49, Microsoft Edge >= 12, Mozilla Firefox >= 18, Opera >= 36, Safari >= 10, Node >= 6.0.0.

## Limitations

- Since workers run in a separate thread, all operations are asynchronous, and will return thenables
- The transferred data needs to be serializable, most browsers implement the [structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) for transferring data
- The transferred data is always copied, which means the references will be different, and any mutations won't be visible

## How it works

The library leverages [proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to intercept actions such as property access, function call etc., and then the details of the actions are sent to the web worker via the messaging API. The proxied object in the web worker recieves and performs the action, then sends the results back via the messaging API. Every action contains a unique id to distinguish itself from other actions.

## Contributing

While developing, you can run the example app and open the console to see your changes:

```sh
yarn example
```

Make sure your code passes the unit tests, Flow and ESLint. Run the following to verify:

```sh
yarn test
yarn flow
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint -- --fix
```

<!-- badges -->

[build-badge]: https://img.shields.io/circleci/project/github/satya164/web-worker-proxy/master.svg?style=flat-square
[build]: https://circleci.com/gh/satya164/web-worker-proxy
[coverage-badge]: https://img.shields.io/codecov/c/github/satya164/web-worker-proxy.svg?style=flat-square
[coverage]: https://codecov.io/github/satya164/web-worker-proxy
[license-badge]: https://img.shields.io/npm/l/web-worker-proxy.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[version-badge]: https://img.shields.io/npm/v/web-worker-proxy.svg?style=flat-square
[package]: https://www.npmjs.com/package/web-worker-proxy
[bundle-size-badge]: https://img.shields.io/bundlephobia/minzip/web-worker-proxy.svg?style=flat-square
[bundle-size]: https://bundlephobia.com/result?p=web-worker-proxy
