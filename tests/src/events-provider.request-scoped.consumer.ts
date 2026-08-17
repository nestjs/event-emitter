import { Inject, Injectable } from '@nestjs/common';
import { EVENT_PAYLOAD, OnEvent } from '../../lib/index.js';
import { RequestScopedEventPayload } from './request-scoped-event-payload.js';

@Injectable()
export class EventsProviderRequestScopedConsumer {
  constructor(@Inject(EVENT_PAYLOAD) public eventRef: any) {
    EventsProviderRequestScopedConsumer.injectedEventPayload.setPayload(
      this.eventRef,
    );
  }

  public static injectedEventPayload = new RequestScopedEventPayload();

  @OnEvent('test.*')
  onTestEvent() {}

  @OnEvent('multiple.*')
  onMultiplePayloadEvent() {}

  @OnEvent('string.*')
  onStringPayloadEvent() {}

  @OnEvent('error-handling.request-scoped')
  onErrorHandlingEvent() {
    throw new Error('This is a test error');
  }

  @OnEvent('error-handling-suppressed.request-scoped', { suppressErrors: true })
  onErrorHandlingSuppressedEvent() {
    throw new Error('This is a test error');
  }

  @OnEvent('error-throwing.request-scoped', { suppressErrors: false })
  onErrorThrowingEvent() {
    throw new Error('This is a test error');
  }

  @OnEvent('not-durable')
  onDurableTest() {
    return this;
  }
}
