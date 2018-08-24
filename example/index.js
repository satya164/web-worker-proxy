/* @flow */

import { create } from '../src/index';

const worker = create(new Worker('./worker.js'));

// Access a property
worker.name.then(console.log);

// Call a function
worker.add(3, 4).then(console.log);

// Set a property
worker.quote = 'Existence is pain';
