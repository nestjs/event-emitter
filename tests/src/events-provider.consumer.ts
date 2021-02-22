import { Injectable } from '@nestjs/common';
import { OnEvent } from '../../lib';

@Injectable()
export class EventsProviderConsumer {
  public eventPayload = {};

  @OnEvent('test.*')
  onTestEvent(payload: Record<string, any>) {
    this.eventPayload = payload;
  }
}
