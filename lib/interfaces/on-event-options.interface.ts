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
   * Listener priority. Higher values run first. Listeners that share a
   * priority run in parallel, and a group finishes before the next lower
   * priority starts. Listeners that omit this option use priority `1`.
   *
   * `emitAsync()` resolves with listener results ordered from the highest
   * priority to the lowest. `async`, `promisify`, and `nextTick` still defer
   * listeners when no listener on the emission sets `priority`.
   *
   * @default 1
   */
  priority?: number;
};
