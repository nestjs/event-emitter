import { Controller, Injectable } from '@nestjs/common';
import { OnEvent } from '../../lib';

@Controller()
export class EventsControllerConsumer {
  public eventPayload = {};

  @OnEvent('test.*')
  onTestEvent(payload: Record<string, any>) {
    this.eventPayload = payload;
  }
}
