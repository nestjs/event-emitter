// The package is ESM-only, so CommonJS consumers reach it through Node's
// require(esm) support. Anything that breaks that breaks most Nest apps.
const assert = require('node:assert/strict');
require('reflect-metadata');
const {
  EVENT_PAYLOAD,
  EventEmitter2,
  EventEmitterModule,
  EventEmitterReadinessWatcher,
  OnEvent,
} = require('../../dist/index.js');

assert.equal(typeof EventEmitter2, 'function');
assert.equal(typeof new EventEmitter2().emit, 'function');
assert.equal(typeof OnEvent, 'function');
assert.equal(typeof EventEmitterReadinessWatcher, 'function');
assert.ok(EVENT_PAYLOAD);
assert.equal(EventEmitterModule.forRoot().module, EventEmitterModule);

console.log('cjs require: ok');
