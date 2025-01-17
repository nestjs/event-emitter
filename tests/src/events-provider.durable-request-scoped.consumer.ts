import { Inject, Injectable, Scope } from '@nestjs/common';
import { OnEvent } from '../../lib';
import { EVENT_PAYLOAD } from '../../lib';
import { RequestScopedEventPayload } from './request-scoped-event-payload';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class EventsProviderDurableRequestScopedConsumer {
  constructor(@Inject(EVENT_PAYLOAD) public eventRef: any) {}

  public static injectedEventPayload = new RequestScopedEventPayload();

  private transformPayload = (payload: unknown[]) =>
    payload.length === 1 ? payload[0] : payload;

  @OnEvent('test.*')
  onTestEvent(...payload: unknown[]) {
    EventsProviderDurableRequestScopedConsumer.injectedEventPayload.setPayload(
      this.transformPayload(payload),
    );
  }

  @OnEvent('multiple.*')
  onMultiplePayloadEvent(...payload: unknown[]) {
    EventsProviderDurableRequestScopedConsumer.injectedEventPayload.setPayload(
      this.transformPayload(payload),
    );
  }

  @OnEvent('string.*')
  onStringPayloadEvent(payload: string) {
    EventsProviderDurableRequestScopedConsumer.injectedEventPayload.setPayload(
      payload,
    );
  }

  @OnEvent('error-handling.durable-request-scoped')
  onErrorHandlingEvent() {
    throw new Error('This is a test error');
  }

  @OnEvent('error-handling-suppressed.durable-request-scoped', {
    suppressErrors: true,
  })
  onErrorHandlingSuppressedEvent() {
    throw new Error('This is a test error');
  }

  @OnEvent('error-throwing.durable-request-scoped', { suppressErrors: false })
  onErrorThrowingEvent() {
    throw new Error('This is a test error');
  }

  @OnEvent('durable')
  onDurableTest() {
    return this;
  }
}
