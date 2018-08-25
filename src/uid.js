/* @flow */

export default function uid() {
  return Array.from({ length: 128 / 16 }, () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1)
  ).join('');
}
