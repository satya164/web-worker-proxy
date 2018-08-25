/* @flow */

export type Worker = {
  +addEventListener: (name: 'message', cb: (e: any) => mixed) => mixed,
  +removeEventListener: (name: 'message', cb: (e: any) => mixed) => mixed,
  +postMessage: (data: mixed) => mixed,
};

export type Action =
  | { type: 'get', key: string | number }
  | { type: 'set', key: string | number, value: any }
  | { type: 'apply', key: string | number, args: any[] }
  | { type: 'construct', key: string | number, args: any[] };
