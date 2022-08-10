import { Injectable } from '@nestjs/common';
import { OnEvent } from '../../lib';

@Injectable()
export class EventsProviderConsumer {
  public eventPayload = {};
  public eventReceiveCount = 0;

  @OnEvent('test.*')
  onTestEvent(payload: Record<string, any>) {
    this.eventPayload = payload;
    this.eventReceiveCount++;
  }
}
