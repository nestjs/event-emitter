import { OnOptions } from 'eventemitter2';

/**
 * Options for the `@OnEvent` decorator.
 *
 * @publicApi
 */
export type OnEventOptions = OnOptions & {
  /**
   * If "true", prepends (instead of append) the given listener to the array of listeners.
   *
   * @see https://github.com/EventEmitter2/EventEmitter2#emitterprependlistenerevent-listener-options
   *
   * @default false
   */
  prependListener?: boolean;

  /**
   * If "true", the onEvent callback will not throw an error while handling the event. Otherwise, if "false" it will throw an error.
   *
   * @default true
   */
  suppressErrors?: boolean;

  /**
   * Registration priority. Higher values are registered first, so
   * EventEmitter2 calls them first. Listeners that omit this option use `0`:
   * a positive priority runs before them, and a negative one after them.
   * Listeners with the same priority keep discovery order.
   *
   * Priority orders `@OnEvent` listeners of the same event name among
   * themselves. It does not order them against listeners added directly on
   * `EventEmitter2`, and it does not order a wildcard listener (`user.*`)
   * against an exact one (`user.login`). `prependListener: true` listeners
   * stay ahead of the other `@OnEvent` listeners, and each group is ordered
   * by priority.
   *
   * It decides the order listeners are called in, not whether the next one
   * runs. With `async: true`, `promisify`, or `emitAsync()`, a
   * higher-priority listener that rejects does not stop the ones after it.
   * A security check at a higher priority cannot rely on a thrown error to
   * skip a later listener.
   *
   * @default 0
   */
  priority?: number;
};
