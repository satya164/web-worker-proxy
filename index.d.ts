declare module 'web-worker-proxy' {
  export function create(worker: Target): any;

  export function proxy(o: object, target?: Target): { dispose(): void };

  export function persist<T extends (...args: any[]) => any>(
    fn: T
  ): {
    type: string;
    apply(
      that: any,
      args: T extends (...args: infer A) => any ? A : never
    ): ReturnType<T>;
    dispose(): void;
    on(name: 'dispose', cb: () => unknown): void;
    disposed: boolean;
  };
}
