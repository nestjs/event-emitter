import { INestApplication, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventEmitter2 } from 'eventemitter2';
import { EventEmitterModule, OnEvent } from '../../lib/index.js';

@Injectable()
class PriorityListener {
  readonly calls: string[] = [];
  gate: Promise<void> = Promise.resolve();

  @OnEvent('ordered', { priority: 0 })
  low() {
    this.calls.push('low');
  }

  @OnEvent('ordered', { priority: 10 })
  high(payload: string) {
    this.calls.push(`high:${payload}`);
  }

  @OnEvent('ordered')
  normal() {
    this.calls.push('normal');
  }

  @OnEvent('staged', { priority: 10 })
  async first() {
    this.calls.push('first:start');
    await this.gate;
    this.calls.push('first:end');
  }

  @OnEvent('staged')
  last() {
    this.calls.push('last');
  }

  @OnEvent('parallel', { priority: 3 })
  async parallelA() {
    this.calls.push('a:start');
    await this.gate;
    this.calls.push('a:end');
  }

  @OnEvent('parallel', { priority: 3 })
  parallelB() {
    this.calls.push('b:start');
    this.calls.push('b:end');
  }

  @OnEvent('parallel')
  afterParallel() {
    this.calls.push('after');
  }

  @OnEvent('results', { priority: 1 })
  resultLow() {
    return 'low';
  }

  @OnEvent('results', { priority: 8 })
  resultHigh() {
    return 'high';
  }

  @OnEvent('wild.*', { priority: 4 })
  onWildcard(payload: string) {
    this.calls.push(`wild:${payload}`);
  }

  @OnEvent('failing', { priority: 4, suppressErrors: false })
  fail() {
    throw new Error('priority failed');
  }

  @OnEvent('failing')
  afterFail() {
    this.calls.push('after-fail');
  }

  @OnEvent('deferred', { async: true })
  deferred() {
    this.calls.push('deferred');
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

  it('runs listeners from the highest priority to the lowest', async () => {
    const { emitter, listener } = await init();

    emitter.emit('ordered', 'payload');

    expect(listener.calls).toEqual(['high:payload', 'normal', 'low']);
  });

  it('waits for a higher priority group before starting a lower one', async () => {
    const { emitter, listener } = await init();
    let releaseGate!: () => void;
    listener.gate = new Promise(resolve => {
      releaseGate = resolve;
    });

    const pending = emitter.emitAsync('staged');

    expect(listener.calls).toEqual(['first:start']);

    releaseGate();
    await pending;

    expect(listener.calls).toEqual(['first:start', 'first:end', 'last']);
  });

  it('runs listeners that share a priority in parallel', async () => {
    const { emitter, listener } = await init();
    let releaseGate!: () => void;
    listener.gate = new Promise(resolve => {
      releaseGate = resolve;
    });

    const pending = emitter.emitAsync('parallel');

    expect(listener.calls).toEqual(['a:start', 'b:start', 'b:end']);

    releaseGate();
    await pending;

    expect(listener.calls).toEqual([
      'a:start',
      'b:start',
      'b:end',
      'a:end',
      'after',
    ]);
  });

  it('resolves emitAsync with results ordered by priority', async () => {
    const { emitter } = await init();

    await expect(emitter.emitAsync('results')).resolves.toEqual([
      'high',
      'low',
    ]);
  });

  it('matches wildcard listeners by priority', async () => {
    const { emitter, listener } = await init();

    emitter.emit('wild.card', 'payload');

    expect(listener.calls).toEqual(['wild:payload']);
  });

  it('does not run a lower priority when a higher one fails', async () => {
    const { emitter, listener } = await init();

    await expect(emitter.emitAsync('failing')).rejects.toThrow(
      'priority failed',
    );
    expect(listener.calls).not.toContain('after-fail');
  });

  it('still defers listeners configured with async when priority is omitted', async () => {
    const { emitter, listener } = await init();

    emitter.emit('deferred');
    expect(listener.calls).not.toContain('deferred');

    await new Promise<void>(resolve => {
      setImmediate(resolve);
    });

    expect(listener.calls).toEqual(['deferred']);
  });
});
