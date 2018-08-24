# Web worker proxy

A better way of working with web workers. Uses [JavaScript Proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to make communcation with web workers similar to interacting with normal objects.

## Features

- Access and set properties on the proxied object in the worker
- Receive thrown errors without extra code for serialization

## Limitations

- Property access and results are asynchronous, instead of a normal value, it'll return a promise
- The data passed to and received from the worker needs to be serializable

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
});
```

Now we can access properties, call methods etc.

```js
// Access property
console.log(await worker.name); // 'John Doe'

// Call a function and get the result
console.log(await worker.add(2, 3)); // 5

// Set a value
worker.works = true;

console.log(await worker.works); // true
```
