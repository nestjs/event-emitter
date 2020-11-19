import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

@Injectable()
export class EventsProducer implements OnApplicationBootstrap {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  onApplicationBootstrap() {
    this.eventEmitter.emit('test.event', { test: 'event' });
  }
}
