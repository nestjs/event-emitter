import eventemitter2 from 'eventemitter2';
import type { EventEmitter2 as EventEmitter2Class } from 'eventemitter2';

/**
 * `eventemitter2` is a CommonJS package, so Node cannot detect its named
 * exports statically - `import { EventEmitter2 } from 'eventemitter2'` throws
 * at load time in an ES module. The class has to be read off the default
 * export instead, which is re-exported here so the rest of the codebase can
 * keep using `EventEmitter2` as both a value and a type.
 */
export const EventEmitter2 = ((
  eventemitter2 as unknown as { EventEmitter2?: typeof EventEmitter2Class }
).EventEmitter2 ?? eventemitter2) as unknown as typeof EventEmitter2Class;

export type EventEmitter2 = EventEmitter2Class;
