import { ListenerTiming } from './listener-timing.interface.js';

export interface QueuedListener {
  priority: number;
  fn: () => unknown;
  timing?: ListenerTiming;
  listenerIsAsync: boolean;
  settled: boolean;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}
