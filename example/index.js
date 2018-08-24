/* @flow */

import { create } from '../src/index';

const worker = create(new Worker('./worker.js'));

worker.name.then(console.log);

worker.add(3, 4).then(console.log);
worker.timeout(100).then(console.log);

worker.error().catch(console.log);

worker.works = true;
/* $FlowFixMe */
worker.works.then(console.log);
