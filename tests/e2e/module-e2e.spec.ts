import { INestApplication } from '@nestjs/common';
import { ContextIdFactory, createContextId } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { EventEmitter2 } from 'eventemitter2';
import { EventEmitterReadinessWatcher } from '../../lib';
import { AppModule } from '../src/app.module';
import {
  TEST_EVENT_MULTIPLE_PAYLOAD,
  TEST_EVENT_PAYLOAD,
  TEST_EVENT_STRING_PAYLOAD,
} from '../src/constants';
import { CUSTOM_DECORATOR_EVENT } from '../src/custom-decorator-test.constants';
import { CustomEventDecoratorConsumer } from '../src/custom-decorator-test.consumer';
import { EventsControllerConsumer } from '../src/events-controller.consumer';
import { EventsProviderAliasedConsumer } from '../src/events-provider-aliased.consumer';
import { EventsProviderPrependConsumer } from '../src/events-provider-prepend.consumer';
import { EventsProviderConsumer } from '../src/events-provider.consumer';
import { EventsProviderDurableRequestScopedConsumer } from '../src/events-provider.durable-request-scoped.consumer';
import { EventsProviderRequestScopedConsumer } from '../src/events-provider.request-scoped.consumer';
import { TEST_PROVIDER_TOKEN } from '../src/test-provider';

describe('EventEmitterModule - e2e', () => {
  let app: INestApplication;
  const durableContextId = createContextId();

  beforeAll(() => {
    ContextIdFactory.apply({
      attach: (contextId, _request) => info => {
        return info.isTreeDurable ? durableContextId : contextId;
      },
    });
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
  });

  it(`should emit a "test-event" event to providers`, async () => {
    const eventsConsumerRef = app.get(EventsProviderConsumer);
    await app.init();

    expect(eventsConsumerRef.eventPayload).toEqual(TEST_EVENT_PAYLOAD);
  });

  it(`should emit a "stacked-event" event to providers`, async () => {
    const eventsConsumerRef = app.get(EventsProviderConsumer);
    await app.init();

    expect(eventsConsumerRef.stackedEventCalls).toEqual(2);
  });

  it(`aliased providers should receive an event only once`, async () => {
    const eventsConsumerRef = app.get(EventsProviderAliasedConsumer);
    const eventSpy = jest.spyOn(eventsConsumerRef, 'eventPayload', 'set');
    await app.init();

    expect(eventSpy).toBeCalledTimes(1);
    eventSpy.mockRestore();
  });

  it(`event subscribers are separate per each app instance`, async () => {
    const eventsConsumerRef = app.get(EventsProviderAliasedConsumer);
    const eventSpy = jest.spyOn(eventsConsumerRef, 'eventPayload', 'set');

    await app.init();

    const module2 = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app2 = module2.createNestApplication();
    await app2.init();

    expect(eventSpy).toBeCalledTimes(1);
    eventSpy.mockRestore();
  });

  it(`should emit a "test-event" event to controllers`, async () => {
    const eventsConsumerRef = app.get(EventsControllerConsumer);
    await app.init();

    expect(eventsConsumerRef.eventPayload).toEqual(TEST_EVENT_PAYLOAD);
  });

  it('should be able to specify a consumer be prepended via OnEvent decorator options', async () => {
    const eventsConsumerRef = app.get(EventsProviderPrependConsumer);
    const prependListenerSpy = jest.spyOn(
      app.get(EventEmitter2),
      'prependListener',
    );
    await app.init();

    expect(eventsConsumerRef.eventPayload).toEqual(TEST_EVENT_PAYLOAD);
    expect(prependListenerSpy).toHaveBeenCalled();
  });

  it('should work with null prototype provider value', async () => {
    const moduleWithNullProvider = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TEST_PROVIDER_TOKEN)
      .useFactory({
        factory: () => {
          const testObject = { a: 13, b: 7 };
          Object.setPrototypeOf(testObject, null);
          return testObject;
        },
      })
      .compile();
    app = moduleWithNullProvider.createNestApplication();
    await expect(app.init()).resolves.not.toThrow();
  });

  it('should be able to emit a request-scoped event with a single payload', async () => {
    await app.init();

    expect(
      EventsProviderRequestScopedConsumer.injectedEventPayload.objectValue,
    ).toEqual(TEST_EVENT_PAYLOAD);
  });

  it('should be able to emit a durable request-scoped event with a single payload', async () => {
    await app.init();

    expect(
      EventsProviderDurableRequestScopedConsumer.injectedEventPayload
        .objectValue,
    ).toEqual(TEST_EVENT_PAYLOAD);
  });

  it('should be able to emit a request-scoped event with a string payload', async () => {
    await app.init();

    expect(
      EventsProviderRequestScopedConsumer.injectedEventPayload.stringValue,
    ).toEqual(TEST_EVENT_STRING_PAYLOAD);
  });

  it('should be able to emit a durable request-scoped event with a string payload', async () => {
    await app.init();

    expect(
      EventsProviderDurableRequestScopedConsumer.injectedEventPayload
        .stringValue,
    ).toEqual(TEST_EVENT_STRING_PAYLOAD);
  });

  it('should be able to emit a request-scoped event with multiple payloads', async () => {
    await app.init();

    expect(
      EventsProviderRequestScopedConsumer.injectedEventPayload.arrayValue,
    ).toEqual(TEST_EVENT_MULTIPLE_PAYLOAD);
  });

  it('should be able to emit a durable request-scoped event with multiple payloads', async () => {
    await app.init();

    expect(
      EventsProviderDurableRequestScopedConsumer.injectedEventPayload
        .arrayValue,
    ).toEqual(TEST_EVENT_MULTIPLE_PAYLOAD);
  });

  it('should work with non array metadata', async () => {
    await app.init();

    const emitter = app.get(EventEmitter2);
    const customConsumer = app.get(CustomEventDecoratorConsumer);

    // callback called synchronysly
    emitter.emit(CUSTOM_DECORATOR_EVENT);

    expect(customConsumer.isEmitted).toBeTruthy();
  });

  it('should be able to gracefully recover when an unexpected error occurs from provider', async () => {
    const eventsConsumerRef = app.get(EventsProviderConsumer);
    await app.init();

    const emitter = app.get(EventEmitter2);
    const result = emitter.emit('error-handling.provider');

    expect(eventsConsumerRef.errorHandlingCalls).toEqual(1);
    expect(result).toBeTruthy();
  });

  it('should be able to gracefully recover when an unexpected error occurs from provider and suppressErrors is true', async () => {
    const eventsConsumerRef = app.get(EventsProviderConsumer);
    await app.init();

    const emitter = app.get(EventEmitter2);
    const result = emitter.emit('error-handling-suppressed.provider');

    expect(eventsConsumerRef.errorHandlingCalls).toEqual(1);
    expect(result).toBeTruthy();
  });

  it('should be able to gracefully recover when an unexpected error occurs from request scoped', async () => {
    await app.init();

    const eventEmitter = app.get(EventEmitter2);
    const result = eventEmitter.emit('error-handling.request-scoped');

    expect(result).toBeTruthy();
  });

  it('should be able to gracefully recover when an unexpected error occurs from request scoped and suppressErrors is true', async () => {
    await app.init();

    const eventEmitter = app.get(EventEmitter2);
    const result = eventEmitter.emit(
      'error-handling-suppressed.request-scoped',
    );

    expect(result).toBeTruthy();
  });

  it('should throw when an unexpected error occurs from provider and suppressErrors is false', async () => {
    await app.init();

    const eventEmitter = app.get(EventEmitter2);
    expect(eventEmitter.emitAsync('error-throwing.provider')).rejects.toThrow(
      'This is a test error',
    );
  });

  it('should throw when an unexpected error occurs from request scoped and suppressErrors is false', async () => {
    await app.init();

    const eventEmitter = app.get(EventEmitter2);
    expect(
      eventEmitter.emitAsync('error-throwing.request-scoped'),
    ).rejects.toThrow('This is a test error');
  });

  it('should be able to wait until the event emitter is ready', async () => {
    const eventsConsumerRef = app.get(EventsControllerConsumer);
    await app.init();

    const eventEmitterWatcher = app.get(EventEmitterReadinessWatcher);
    await expect(eventEmitterWatcher.waitUntilReady()).resolves.toBeUndefined();
    expect(eventsConsumerRef.eventPayload).toEqual(TEST_EVENT_PAYLOAD);
  });

  it('should throw when an unexpected error occurs from durable request scoped and suppressErrors is false', async () => {
    await app.init();

    const eventEmitter = app.get(EventEmitter2);
    expect(
      eventEmitter.emitAsync('error-throwing.durable-request-scoped'),
    ).rejects.toThrow('This is a test error');
  });

  it('should load durable provider once for different event emissions', async () => {
    await app.init();
    const eventEmitter = app.get(EventEmitter2);
    const [durableInstance] = await eventEmitter.emitAsync('durable');
    const [durableInstance2] = await eventEmitter.emitAsync('durable');
    expect(durableInstance).toBe(durableInstance2);
  });

  it('should load non-durable provider anew for different event emissions', async () => {
    await app.init();
    const eventEmitter = app.get(EventEmitter2);
    const [notDurableInstance] = await eventEmitter.emitAsync('not-durable');
    const [notDurableInstance2] = await eventEmitter.emitAsync('not-durable');
    expect(notDurableInstance).not.toBe(notDurableInstance2);
  });

  afterEach(async () => {
    await app.close();
  });
});
