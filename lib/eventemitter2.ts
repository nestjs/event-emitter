import eventemitter2 from 'eventemitter2';

/**
 * `eventemitter2` is a CommonJS package, so Node cannot detect its named
 * exports statically - `import { EventEmitter2 } from 'eventemitter2'` throws
 * at load time in an ES module. The class has to be read off the default
 * export instead, which is re-exported here so the rest of the codebase can
 * keep using `EventEmitter2` as both a value and a type.
 */
export const EventEmitter2 = eventemitter2.EventEmitter2;
export type EventEmitter2 = InstanceType<typeof EventEmitter2>;
