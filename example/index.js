/* @flow */

import { create, persist } from '../src/index';

const worker = create(new Worker('./worker.js'));

worker.name.then(console.log);
worker.fruits.then(console.log);
worker.show.then(console.log);

worker.fruits[1].then(console.log);
worker.show.genre.then(console.log);

worker.add(3, 4).then(console.log);
worker.timeout(100).then(console.log);

worker.throw().catch(console.log);

worker.works = true;
/* $FlowFixMe */
worker.works.then(console.log);

worker.callback(result => {
  console.log(result);
});

const listener = persist(result => {
  console.log(result);

  if (result.index === 2) {
    listener.dispose();
  }
});

worker.callback(listener, 3);
