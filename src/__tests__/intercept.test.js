/* @flow */

import intercept from '../intercept';

it('intercepts property access', async () => {
  expect.assertions(2);

  const o = intercept(async actions => {
    expect(actions).toEqual([
      { type: 'get', key: 'foo' },
      { type: 'get', key: 'bar' },
      { type: 'get', key: 'baz' },
    ]);

    return 42;
  });

  expect(await o.foo.bar.baz).toBe(42);
});

it('intercepts property when a property is named as then', async () => {
  expect.assertions(2);

  const o = intercept(async actions => {
    expect(actions).toEqual([
      { type: 'get', key: 'foo' },
      { type: 'get', key: 'then' },
      { type: 'get', key: 'bar' },
    ]);

    return 42;
  });

  expect(await o.foo.then.bar).toBe(42);
});

it('intercepts setting a property', async () => {
  expect.assertions(1);

  const o = intercept(async actions => {
    expect(actions).toEqual([
      { type: 'get', key: 'foo' },
      { type: 'get', key: 'bar' },
      { type: 'set', key: 'baz', value: { foo: 13, bar: 81 } },
    ]);
  });

  o.foo.bar.baz = { foo: 13, bar: 81 };
});

it('intercepts function call', async () => {
  expect.assertions(2);

  const o = intercept(async actions => {
    expect(actions).toEqual([
      { type: 'get', key: 'foo' },
      { type: 'get', key: 'bar' },
      { type: 'apply', key: 'baz', args: ['yo', 42] },
    ]);

    return { foo: 'bar' };
  });

  expect(await o.foo.bar.baz('yo', 42)).toEqual({ foo: 'bar' });
});

it('intercepts construction', async () => {
  expect.assertions(2);

  const o = intercept(async actions => {
    expect(actions).toEqual([
      { type: 'get', key: 'foo' },
      { type: 'get', key: 'bar' },
      { type: 'construct', key: 'baz', args: ['yo', 42] },
    ]);

    return 'hello world';
  });

  expect(await new o.foo.bar.baz('yo', 42)).toBe('hello world');
});

it('returns cached promise when accessed from saved variable', async () => {
  expect.assertions(1);

  const o = intercept(async () => {
    // Return an object so we compare references
    return {};
  });

  const { baz } = o.foo.bar;

  const a = await baz;
  const b = await baz;

  expect(a).toBe(b);
});

it('executes again when accessed directly', async () => {
  expect.assertions(2);

  let i = 0;

  const o = intercept(async () => {
    return i++;
  });

  const a = await o.foo.bar.baz;
  const b = await o.foo.bar.baz;

  expect(a).toBe(0);
  expect(b).toBe(1);
});
