# web-worker-proxy

[![Build Status][build-badge]][build]
[![MIT License][license-badge]][license]
[![Version][version-badge]][package]
[![Bundle size (minified + gzip)][bundle-size-badge]][bundle-size]

A better way of working with web workers. Uses [JavaScript Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to make communcation with web workers similar to interacting with normal objects.

## Why

Web workers are great to offload work to a different thread in browsers. However, the messaging based API is not very easy to work with. This library makes working with web workers similar to how you'd interact with a local object, thanks to the power of proxies.

## Features

- Access and set properties on the proxied object asynchronously
- Call functions on the proxied object and receive the result asynchronously
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

First, we need to wrap create a proxied worker:

```js
import { create } from 'web-worker-proxy';

const worker = create(new Worker('worker.js'));
```

Inside the web worker, we need to do wrap the target object:

```js
import { proxy } from 'web-worker-proxy';

proxy({
  // Serializable properties
  name: 'John Doe',

  // Simple functions
  add: (a, b) => a + b,

  // Async functions
  timeout: duration =>
    new Promise(resolve => setTimeout(() => resolve('Hello there'), duration)),

  // Throwing errors
  error() {
    throw new TypeError('This is not right');
  },
});
```

Now we can access properties, call methods etc.

```js
// Access properties
console.log(await worker.name); // 'John Doe'

// Call functions and get the result
console.log(await worker.add(2, 3)); // 5

console.log(await worker.timeout(100)); // Hello there

// Catch errors
try {
  await worker.error();
} catch (e) {
  console.log(e); // TypeError: This is not right
}

// Set values
worker.works = true;

console.log(await worker.works); // true
```

## Supported environments

The library expects the `Proxy` and `WeakMap` constructors to be available globally. If you are using a browser which doesn't support these features, make sure to load appropriate polyfills.

The following environments support these features natively: Google Chrome >= 49, Microsoft Edge >= 12, Mozilla Firefox >= 18, Opera >= 36, Safari >= 10, Node >= 6.0.0.

## Limitations

- Since workers run in a separate thread, all operations are asynchronous, and will return a promise
- The data passed to and received from the worker needs to be serializable

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
[license-badge]: https://img.shields.io/npm/l/web-worker-proxy.svg?style=flat-square
[license]: https://opensource.org/licenses/MIT
[version-badge]: https://img.shields.io/npm/v/web-worker-proxy.svg?style=flat-square
[package]: https://www.npmjs.com/package/web-worker-proxy
[bundle-size-badge]: https://img.shields.io/bundlephobia/minzip/web-worker-proxy.svg?style=flat-square
[bundle-size]: https://bundlephobia.com/result?p=web-worker-proxy
