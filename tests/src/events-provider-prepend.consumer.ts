import { Injectable } from '@nestjs/common';
import { OnEvent } from '../../lib/index.js';

@Injectable()
export class EventsProviderPrependConsumer {
  public eventPayload = {};

  @OnEvent('test.*', { prependListener: true })
  onTestEvent(payload: Record<string, any>) {
    this.eventPayload = payload;
  }
}
