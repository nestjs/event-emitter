import { Injectable } from '@nestjs/common';
import { OnEvent } from '../../lib/index.js';

@Injectable()
export class EventsProviderPriorityConsumer {
  public calls: string[] = [];

  @OnEvent('priority.event', { priority: 0 })
  low() {
    this.calls.push('low');
  }

  @OnEvent('priority.event', { priority: 10 })
  high() {
    this.calls.push('high');
  }

  @OnEvent('priority.event')
  normal() {
    this.calls.push('normal');
  }
}
