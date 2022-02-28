import { Injectable } from '@nestjs/common';
import { OnEvent } from '../../lib';

@Injectable()
export class EventsProviderPrependConsumer {
  public eventPayload = {};

  @OnEvent('test.*', { prependListener: true })
  onTestEvent(payload: Record<string, any>) {
    this.eventPayload = payload;
  }
}
