import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import {
  TEST_EVENT_MULTIPLE_PAYLOAD,
  TEST_EVENT_PAYLOAD,
  TEST_EVENT_STRING_PAYLOAD,
} from './constants';

@Injectable()
export class EventsProducer implements OnApplicationBootstrap {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  onApplicationBootstrap() {
    this.eventEmitter.emit('test.event', TEST_EVENT_PAYLOAD);
    this.eventEmitter.emit('multiple.event', TEST_EVENT_MULTIPLE_PAYLOAD);
    this.eventEmitter.emit('string.event', TEST_EVENT_STRING_PAYLOAD);
    this.eventEmitter.emit('stacked1.event', TEST_EVENT_PAYLOAD);
    this.eventEmitter.emit('stacked2.event', TEST_EVENT_PAYLOAD);
  }
}
