// Loads the built package the way Node does, not the way Vite does: the e2e
// suite runs through Vite's CommonJS interop and therefore cannot catch
// interop mistakes that make the published bundle unloadable.
import assert from 'node:assert/strict';
import 'reflect-metadata';
import {
  EVENT_PAYLOAD,
  EventEmitter2,
  EventEmitterModule,
  EventEmitterReadinessWatcher,
  OnEvent,
} from '../../dist/index.js';

assert.equal(typeof EventEmitter2, 'function');
assert.equal(typeof new EventEmitter2().emit, 'function');
assert.equal(typeof OnEvent, 'function');
assert.equal(typeof EventEmitterReadinessWatcher, 'function');
assert.ok(EVENT_PAYLOAD);
assert.equal(EventEmitterModule.forRoot().module, EventEmitterModule);

console.log('esm import: ok');
