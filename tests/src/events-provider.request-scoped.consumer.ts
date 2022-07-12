import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '../../lib';
import { EVENT_PAYLOAD } from '../../lib';
import { RequestScopedEventPayload } from './request-scoped-event-payload';

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
}
