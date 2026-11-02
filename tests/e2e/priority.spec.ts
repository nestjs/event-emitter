import { vi } from 'vitest';
import { INestApplication, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventEmitter2 } from 'eventemitter2';
import { EventEmitterModule, OnEvent } from '../../lib/index.js';

@Injectable()
class PriorityListener {
  readonly calls: string[] = [];

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.eventEmitter.on('direct.event', () => {
      this.calls.push('direct');
    });
  }

  @OnEvent('ordered', { priority: -5 })
  negative() {
    this.calls.push('negative');
  }

  @OnEvent('ordered')
  normal(payload: string) {
    this.calls.push(`normal:${payload}`);
  }

  @OnEvent('ordered', { priority: 10 })
  high() {
    this.calls.push('high');
  }

  @OnEvent('ties')
  first() {
    this.calls.push('first');
  }

  @OnEvent('ties')
  second() {
    this.calls.push('second');
  }

  @OnEvent('prepend.event', { prependListener: true, priority: -1 })
  prependLow() {
    this.calls.push('prepend-low');
  }

  @OnEvent('prepend.event', { prependListener: true, priority: 5 })
  prependHigh() {
    this.calls.push('prepend-high');
  }

  @OnEvent('prepend.event', { priority: 100 })
  appended() {
    this.calls.push('appended');
  }

  @OnEvent('direct.event', { priority: 50 })
  directHigh() {
    this.calls.push('on-event');
  }

  @OnEvent('user.*', { priority: 100 })
  wildcard() {
    this.calls.push('wildcard');
  }

  @OnEvent('user.login', { priority: -5 })
  exact() {
    this.calls.push('exact');
  }

  @OnEvent('login', { priority: 10, suppressErrors: false })
  checkFraud() {
    this.calls.push('check');
    throw new Error('blocked');
  }

  @OnEvent('login')
  issueToken() {
    this.calls.push('token');
  }

  @OnEvent('timing', { async: true, priority: 5 })
  deferred() {
    this.calls.push('deferred');
  }

  @OnEvent('timing')
  immediate() {
    this.calls.push('immediate');
  }
}

describe('EventEmitterModule - listener priority', () => {
  let app: INestApplication;

  async function init() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        EventEmitterModule.forRoot({
          wildcard: true,
        }),
      ],
      providers: [PriorityListener],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    return {
      emitter: app.get(EventEmitter2),
      listener: app.get(PriorityListener),
    };
  }

  afterEach(async () => {
    await app?.close();
  });

  it('runs a positive priority before the default and a negative one after', async () => {
    const { emitter, listener } = await init();

    emitter.emit('ordered', 'payload');

    expect(listener.calls).toEqual(['high', 'normal:payload', 'negative']);
  });

  it('keeps discovery order when priorities are equal', async () => {
    const { emitter, listener } = await init();

    emitter.emit('ties');

    expect(listener.calls).toEqual(['first', 'second']);
  });

  it('keeps prepended listeners ahead and orders that group by priority', async () => {
    const { emitter, listener } = await init();

    emitter.emit('prepend.event');

    expect(listener.calls).toEqual(['prepend-high', 'prepend-low', 'appended']);
  });

  it('does not move an @OnEvent listener ahead of a direct listener', async () => {
    const { emitter, listener } = await init();

    emitter.emit('direct.event');

    expect(listener.calls).toEqual(['direct', 'on-event']);
  });

  it('does not order a wildcard listener against an exact event name', async () => {
    const { emitter, listener } = await init();

    emitter.emit('user.login');

    expect(listener.calls).toEqual(['exact', 'wildcard']);
  });

  it('still calls the next listener when a higher priority one rejects', async () => {
    const { emitter, listener } = await init();

    await expect(emitter.emitAsync('login')).rejects.toThrow('blocked');
    expect(listener.calls).toEqual(['check', 'token']);
  });

  it('still defers async listeners when priority is set', async () => {
    const { emitter, listener } = await init();

    emitter.emit('timing');
    expect(listener.calls).toEqual(['immediate']);

    await new Promise<void>(resolve => {
      setImmediate(resolve);
    });

    expect(listener.calls).toEqual(['immediate', 'deferred']);
  });

  it('forwards listener options when EventEmitter2 is overridden', async () => {
    const emitter = new EventEmitter2();
    const onSpy = vi.spyOn(emitter, 'on');
    const moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot()],
      providers: [PriorityListener],
    })
      .overrideProvider(EventEmitter2)
      .useValue(emitter)
      .compile();
    const overriddenApp = moduleRef.createNestApplication();

    await overriddenApp.init();

    expect(onSpy).toHaveBeenCalledWith(
      'timing',
      expect.any(Function),
      expect.objectContaining({ async: true, priority: 5 }),
    );
    await overriddenApp.close();
  });
});
