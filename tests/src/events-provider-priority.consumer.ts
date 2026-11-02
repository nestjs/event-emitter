import { Injectable } from '@nestjs/common';
import { OnEvent } from '../../lib/index.js';

@Injectable()
export class EventsProviderPriorityConsumer {
  public calls: string[] = [];

  @OnEvent('priority.event', { priority: -1 })
  negative() {
    this.calls.push('negative');
  }

  @OnEvent('priority.event')
  normal() {
    this.calls.push('normal');
  }

  @OnEvent('priority.event', { priority: 10 })
  high() {
    this.calls.push('high');
  }
}
