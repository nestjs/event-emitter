import { Injectable, Scope } from '@nestjs/common';
import { ScopedEventEmitter } from "../../lib";

@Injectable({ scope: Scope.REQUEST})
export class EventsProducerScoped {
  constructor(private readonly eventEmitter: ScopedEventEmitter) {}

  fireEvent() {
    this.eventEmitter.emit('test.event', { test: 'eventScoped' });
  }

  async fireAsyncEvent(): Promise<void> {
    await this.eventEmitter.emitAsync('testAsync.event', { test: 'scopedAsync'});
  }
}
