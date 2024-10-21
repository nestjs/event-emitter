/**
 * A polyfill for the Promise.withResolvers method that is not available in older versions of Node.js
 * @returns A promise and its resolve and reject functions
 */
export function promiseWithResolvers() {
  let resolve: () => void;
  let reject: (reason?: any) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  // @ts-expect-error "resolve" and "reject" are assigned in the promise constructor
  return { promise, resolve, reject };
}
