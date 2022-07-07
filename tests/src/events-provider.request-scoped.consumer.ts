import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '../../lib';
import { EVENT_PAYLOAD } from '../../lib';

@Injectable()
export class EventsProviderRequestScopedConsumer {
  constructor(@Inject(EVENT_PAYLOAD) public eventRef: any) {
    if (Array.isArray(this.eventRef)) {
      EventsProviderRequestScopedConsumer.injectedEventMultiPayload =
        this.eventRef;
    } else {
      EventsProviderRequestScopedConsumer.injectedEventPayload = this.eventRef;
    }
  }

  public static injectedEventPayload = {};
  public static injectedEventMultiPayload: any[] = [];

  @OnEvent('test.*')
  onTestEvent() {}

  @OnEvent('multiple.*')
  onMultiplePayloadEvent() {}
}
