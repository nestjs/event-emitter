import eventemitter2 from 'eventemitter2';
import type { EventEmitter2 as EventEmitter2Class } from 'eventemitter2';

/**
 * `eventemitter2` is a CommonJS package, so Node cannot detect its named
 * exports statically - `import { EventEmitter2 } from 'eventemitter2'` throws
 * at load time in an ES module. The class has to be read off the default
 * export instead, which is re-exported here so the rest of the codebase can
 * keep using `EventEmitter2` as both a value and a type.
 *
 * The explicit annotation matters: without it, the emitted declaration infers
 * `typeof eventemitter2.EventEmitter2`, which only resolves under
 * `moduleResolution: "nodenext"`. Consumers on `"bundler"` resolve the default
 * import to the class itself rather than to the `module.exports` namespace, so
 * that inferred type collapses to `any` for them.
 */
export const EventEmitter2: typeof EventEmitter2Class = eventemitter2.EventEmitter2;
export type EventEmitter2 = EventEmitter2Class;
