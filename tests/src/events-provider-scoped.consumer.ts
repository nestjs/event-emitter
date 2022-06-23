import {Inject, Injectable, Scope} from '@nestjs/common';
import {OnEvent} from '../../lib';
import {REQUEST} from "@nestjs/core";

@Injectable({ scope: Scope.REQUEST})
export class ServiceHandler {
  constructor(@Inject(REQUEST) private readonly request: any) {}

  handle<T>(payload: T): T {
    return payload;
  }
}

@Injectable({ scope: Scope.REQUEST})
export class EventsProviderConsumerScoped {
  public eventPayload = {};

  constructor(private readonly svc: ServiceHandler) {}

  @OnEvent('test.*')
  onTestEvent(payload: Record<string, any>) {
    this.eventPayload = this.svc.handle(payload);
  }

  @OnEvent('testAsync.*')
  async onTestEventAsync(payload: Record<string, any>): Promise<void> {
    await new Promise(r => setTimeout(r, 1000))
    this.eventPayload = this.svc.handle(payload);
  }
}
