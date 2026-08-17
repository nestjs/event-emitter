import { vi } from 'vitest';
import {
  Controller,
  INestApplication,
  Inject,
  Injectable,
  Scope,
} from '@nestjs/common';
import { ContextIdFactory, createContextId, REQUEST } from '@nestjs/core';
import { REQUEST_CONTEXT_ID } from '@nestjs/core/router/request/request-constants.js';
import { Test } from '@nestjs/testing';
import { EventEmitter2 } from 'eventemitter2';
import { EventEmitterModule, OnEvent } from '../../lib/index.js';

@Injectable({ scope: Scope.REQUEST })
class RequestScopedListener {
  @OnEvent('inherit.test')
  onTest() {}
}

@Injectable({ scope: Scope.REQUEST })
class RequestScopedState {
  private static nextId = 1;

  static reset() {
    RequestScopedState.nextId = 1;
  }

  readonly id = RequestScopedState.nextId++;
}

@Injectable({ scope: Scope.REQUEST })
class InheritedContextListener {
  static records: Array<{
    listenerRequest: unknown;
    listenerStateId: number;
  }> = [];

  static reset() {
    InheritedContextListener.records = [];
  }

  constructor(
    @Inject(REQUEST) private readonly request: unknown,
    private readonly state: RequestScopedState,
  ) {}

  @OnEvent('inherit.http')
  onTest() {
    InheritedContextListener.records.push({
      listenerRequest: this.request,
      listenerStateId: this.state.id,
    });
  }
}

@Controller()
class InheritedContextController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly state: RequestScopedState,
  ) {}

  async inherit(request: unknown) {
    await this.eventEmitter.emitAsync('inherit.http', request);
    return {
      controllerStateId: this.state.id,
      listenerStateId: InheritedContextListener.records[0]?.listenerStateId,
      sameRequest:
        InheritedContextListener.records[0]?.listenerRequest === request,
    };
  }
}

describe('EventEmitterModule - inheritRequestContextId', () => {
  async function createHttpApp(
    inheritRequestContextId: boolean,
  ): Promise<INestApplication> {
    RequestScopedState.reset();
    InheritedContextListener.reset();

    const moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot({ inheritRequestContextId })],
      controllers: [InheritedContextController],
      providers: [RequestScopedState, InheritedContextListener],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  async function callInRequestContext(app: INestApplication) {
    const request = {};
    const contextId = createContextId();
    Object.defineProperty(request, REQUEST_CONTEXT_ID, {
      value: contextId,
    });
    app.registerRequestByContextId(request, contextId);

    const controller = await app.resolve(InheritedContextController, contextId);
    return controller.inherit(request);
  }

  it('default (false): wraps request in EventPayloadHost', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot({})],
      providers: [RequestScopedListener],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const spy = vi.spyOn(ContextIdFactory, 'getByRequest');
    const payload = { id: 1 };
    app.get(EventEmitter2).emit('inherit.test', payload);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual({ payload });

    spy.mockRestore();
    await app.close();
  });

  it('inheritRequestContextId=true: forwards original request directly', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot({ inheritRequestContextId: true })],
      providers: [RequestScopedListener],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const spy = vi.spyOn(ContextIdFactory, 'getByRequest');
    const payload = { id: 2 };
    app.get(EventEmitter2).emit('inherit.test', payload);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toBe(payload);

    spy.mockRestore();
    await app.close();
  });

  it('inheritRequestContextId=true: passes original request to context id strategy', async () => {
    const sharedContextId = createContextId();
    const attachSpy = vi.fn(
      (contextId: ReturnType<typeof createContextId>, request: unknown) =>
        (info: { isTreeDurable: boolean }) =>
          info.isTreeDurable ? sharedContextId : contextId,
    );
    ContextIdFactory.apply({
      attach: attachSpy,
    });

    const moduleRef = await Test.createTestingModule({
      imports: [EventEmitterModule.forRoot({ inheritRequestContextId: true })],
      providers: [RequestScopedListener],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const payload = { id: 3 };
    app.get(EventEmitter2).emit('inherit.test', payload);

    expect(attachSpy).toHaveBeenCalled();
    const [, request] = attachSpy.mock.calls[0];
    expect(request).toBe(payload);

    await app.close();
  });

  it('default (false): creates a separate request-scoped listener context', async () => {
    const app = await createHttpApp(false);
    const result = await callInRequestContext(app);

    expect(result.sameRequest).toBe(true);
    expect(result.listenerStateId).not.toBe(result.controllerStateId);

    await app.close();
  });

  it('inheritRequestContextId=true: reuses the originating request context', async () => {
    const app = await createHttpApp(true);
    const result = await callInRequestContext(app);

    expect(result.sameRequest).toBe(true);
    expect(result.listenerStateId).toBe(result.controllerStateId);

    await app.close();
  });
});
