import type { event, eventNS } from 'eventemitter2';
import { Emission } from './prioritized-emission.js';
import { EventEmitter2 } from './eventemitter2.js';
import { OnEventOptions } from './interfaces/index.js';
import {
  invokeListener,
  readTiming,
} from './utils/prioritized-listener.util.js';
import { EventName } from './event-emitter.types.js';

/**
 * Runs `@OnEvent` listeners in priority order.
 *
 * EventEmitter2 invokes listeners in registration order and, for `emitAsync`,
 * starts them all at once. This subclass collects those listeners during an
 * emission and replays them so a higher `priority` finishes before a lower one
 * starts. Listeners that do not set `priority` keep the previous order.
 */
export class PrioritizedEventEmitter extends EventEmitter2 {
  private readonly emissionStack: Emission[] = [];

  override emit(event: EventName, ...values: any[]): boolean {
    const emission = this.openEmission();
    let result = false;
    try {
      result = super.emit(event, ...values);
    } catch (error) {
      emission.abandon(error);
      throw error;
    } finally {
      this.closeEmission();
    }

    this.flush(emission, false);
    return result;
  }

  override emitAsync(event: EventName, ...values: any[]): Promise<any[]> {
    const emission = this.openEmission();
    let result: Promise<any[]>;
    try {
      result = super.emitAsync(event, ...values);
    } catch (error) {
      emission.abandon(error);
      throw error;
    } finally {
      this.closeEmission();
    }

    return this.flush(emission, true, result) as Promise<any[]>;
  }

  /**
   * Joins the listener to the emission currently being dispatched.
   * Outside of `emit` / `emitAsync`, the listener runs immediately.
   */
  runListener(
    options: OnEventOptions | undefined,
    listenerIsAsync: boolean,
    fn: () => unknown,
  ): unknown {
    const emission = this.emissionStack[this.emissionStack.length - 1];
    if (!emission) {
      return invokeListener(readTiming(options), listenerIsAsync, fn);
    }
    return emission.enqueue(options, listenerIsAsync, fn);
  }

  private openEmission(): Emission {
    const emission = new Emission();
    this.emissionStack.push(emission);
    return emission;
  }

  private closeEmission() {
    this.emissionStack.pop();
  }

  private flush(
    emission: Emission,
    asyncEmit: boolean,
    nativeResult?: Promise<any[]>,
  ): Promise<any[]> | undefined {
    if (!emission.hasExplicitPriority) {
      emission.startUnordered();
      return asyncEmit ? nativeResult : undefined;
    }

    const ordered = emission.startByPriority();
    if (!asyncEmit) {
      void Promise.resolve(ordered).catch(() => undefined);
      return undefined;
    }

    return Promise.resolve(ordered).then(
      async listenerResults => {
        await nativeResult;
        return listenerResults;
      },
      async (error: unknown) => {
        await Promise.resolve(nativeResult).catch(() => undefined);
        throw error;
      },
    );
  }
}
