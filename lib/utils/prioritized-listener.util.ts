import {
  ListenerTiming,
  OnEventOptions,
  QueuedListener,
} from '../interfaces/index.js';

const DEFAULT_LISTENER_PRIORITY = 1;

/**
 * Runs every listener in one priority group. Listeners that return a promise are awaited together.
 * @returns Listener results, or a promise when any listener is asynchronous
 */
export function invokeGroup(
  group: QueuedListener[],
): unknown[] | Promise<unknown[]> {
  const values: unknown[] = [];
  let pending = false;

  for (const task of group) {
    try {
      const value = task.fn();
      if (isPromise(value)) {
        pending = true;
        values.push(
          value.then(
            resolved => {
              settleResolve(task, resolved);
              return resolved;
            },
            (error: unknown) => {
              settleReject(task, error);
              throw error;
            },
          ),
        );
      } else {
        settleResolve(task, value);
        values.push(value);
      }
    } catch (error) {
      settleReject(task, error);
      pending = true;
      values.push(Promise.reject(error));
    }
  }

  if (!pending) {
    return values;
  }
  return Promise.all(values);
}

/**
 * Calls a listener, deferring it when async, promisify, or nextTick timing is set.
 * @returns The listener result, or undefined when the call is deferred without a promise
 */
export function invokeListener(
  timing: ListenerTiming | undefined,
  listenerIsAsync: boolean,
  fn: () => unknown,
): unknown {
  if (!timing) {
    return fn();
  }

  const promisify =
    timing.promisify === undefined ? listenerIsAsync : timing.promisify;

  if (promisify) {
    const scheduled = timing.nextTick
      ? Promise.resolve()
      : new Promise<void>(resolve => {
          setImmediate(resolve);
        });
    return scheduled.then(() => fn());
  }

  if (timing.nextTick) {
    process.nextTick(() => {
      void fn();
    });
    return undefined;
  }

  setImmediate(() => {
    void fn();
  });
  return undefined;
}

/**
 * Reads EventEmitter2 timing flags from listener options.
 * @returns The timing flags, or undefined when the listener should run immediately
 */
export function readTiming(
  options?: OnEventOptions,
): ListenerTiming | undefined {
  if (!options?.async && !options?.nextTick && !options?.promisify) {
    return undefined;
  }
  return {
    async: options.async,
    promisify: options.promisify,
    nextTick: options.nextTick,
  };
}

/**
 * Checks whether a listener option is a finite priority number.
 * @returns True when the value is a finite number
 */
export function hasExplicitPriority(
  priority: number | undefined,
): priority is number {
  return typeof priority === 'number' && Number.isFinite(priority);
}

/**
 * Returns the listener priority, using 1 when none is set.
 * @returns The priority used to order the listener
 */
export function resolvePriority(priority: number | undefined): number {
  return hasExplicitPriority(priority) ? priority : DEFAULT_LISTENER_PRIORITY;
}

/**
 * Resolves a queued listener once. Later calls are ignored.
 */
export function settleResolve(task: QueuedListener, value: unknown) {
  if (task.settled) {
    return;
  }
  task.settled = true;
  task.resolve(value);
}

/**
 * Rejects a queued listener once. Later calls are ignored.
 */
export function settleReject(task: QueuedListener, error: unknown) {
  if (task.settled) {
    return;
  }
  task.settled = true;
  task.reject(error);
}

/**
 * Checks whether a value is a thenable.
 * @returns True when the value has a then method
 */
export function isPromise(value: unknown): value is Promise<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Promise<unknown>).then === 'function'
  );
}
