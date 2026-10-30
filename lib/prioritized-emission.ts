import { OnEventOptions, QueuedListener } from './interfaces/index.js';
import {
  hasExplicitPriority,
  invokeGroup,
  invokeListener,
  isPromise,
  readTiming,
  resolvePriority,
  settleReject,
  settleResolve,
} from './utils/prioritized-listener.util.js';

/**
 * Collects the listeners for one emit call and runs them together.
 */
export class Emission {
  private readonly tasks: QueuedListener[] = [];
  hasExplicitPriority = false;

  /**
   * Adds a listener to this emission.
   * @returns A promise that settles when the listener finishes
   */
  enqueue(
    options: OnEventOptions | undefined,
    listenerIsAsync: boolean,
    fn: () => unknown,
  ): Promise<unknown> {
    if (hasExplicitPriority(options?.priority)) {
      this.hasExplicitPriority = true;
    }

    return new Promise((resolve, reject) => {
      this.tasks.push({
        priority: resolvePriority(options?.priority),
        fn,
        timing: readTiming(options),
        listenerIsAsync,
        settled: false,
        resolve,
        reject,
      });
    });
  }

  /**
   * Rejects every queued listener with the same error.
   */
  abandon(error: unknown) {
    for (const task of this.tasks) {
      settleReject(task, error);
    }
  }

  /**
   * Runs queued listeners in registration order, without waiting between them.
   */
  startUnordered() {
    for (const task of this.tasks) {
      try {
        const value = invokeListener(
          task.timing,
          task.listenerIsAsync,
          task.fn,
        );
        if (isPromise(value)) {
          value.then(
            resolved => settleResolve(task, resolved),
            error => settleReject(task, error),
          );
        } else {
          settleResolve(task, value);
        }
      } catch (error) {
        settleReject(task, error);
      }
    }
  }

  /**
   * Runs listeners from the highest priority to the lowest. Each group finishes before the next starts.
   * @returns Listener results ordered from the highest priority to the lowest
   */
  startByPriority(): Promise<unknown[]> {
    const groups = new Map<number, QueuedListener[]>();
    for (const task of this.tasks) {
      const group = groups.get(task.priority);
      if (group) {
        group.push(task);
      } else {
        groups.set(task.priority, [task]);
      }
    }

    const priorities = [...groups.keys()].sort((left, right) => right - left);
    const results: unknown[] = [];

    const step = (index: number): unknown[] | Promise<unknown[]> => {
      if (index >= priorities.length) {
        return results;
      }

      const outcome = invokeGroup(groups.get(priorities[index])!);
      if (isPromise(outcome)) {
        return outcome.then(groupResults => {
          results.push(...groupResults);
          return step(index + 1);
        });
      }

      results.push(...outcome);
      return step(index + 1);
    };

    try {
      const outcome = step(0);
      if (!isPromise(outcome)) {
        return Promise.resolve(outcome);
      }
      return outcome.catch((error: unknown) => {
        this.resolveUnsettled();
        throw error;
      });
    } catch (error) {
      this.resolveUnsettled();
      return Promise.reject(error);
    }
  }

  /**
   * Resolves listeners that never started so their promises do not stay pending.
   */
  private resolveUnsettled() {
    for (const task of this.tasks) {
      if (!task.settled) {
        settleResolve(task, undefined);
      }
    }
  }
}
