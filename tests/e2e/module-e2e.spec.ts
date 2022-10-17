import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventEmitter2 } from 'eventemitter2';
import { AppModule } from '../src/app.module';
import {
  TEST_EVENT_MULTIPLE_PAYLOAD,
  TEST_EVENT_PAYLOAD,
  TEST_EVENT_STRING_PAYLOAD,
} from '../src/constants';
import { EventsControllerConsumer } from '../src/events-controller.consumer';
import { EventsProviderAliasedConsumer } from '../src/events-provider-aliased.consumer';
import { EventsProviderPrependConsumer } from '../src/events-provider-prepend.consumer';
import { EventsProviderConsumer } from '../src/events-provider.consumer';
import { EventsProviderRequestScopedConsumer } from '../src/events-provider.request-scoped.consumer';
import { TEST_PROVIDER_TOKEN } from '../src/test-provider';

describe('EventEmitterModule - e2e', () => {
  let app: INestApplication;

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

  it('should be able to emit a request-scoped event with a string payload', async () => {
    await app.init();

    expect(
      EventsProviderRequestScopedConsumer.injectedEventPayload.stringValue,
    ).toEqual(TEST_EVENT_STRING_PAYLOAD);
  });

  it('should be able to emit a request-scoped event with multiple payloads', async () => {
    await app.init();

    expect(
      EventsProviderRequestScopedConsumer.injectedEventPayload.arrayValue,
    ).toEqual(TEST_EVENT_MULTIPLE_PAYLOAD);
  });

  afterEach(async () => {
    await app.close();
  });
});
