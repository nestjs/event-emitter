import { Injectable, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EVENT_LISTENER_METADATA } from './constants';
import { OnEventMetadata } from './decorators';

@Injectable()
export class EventsMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getEventHandlerMetadata(
    target: Type<unknown>,
  ): OnEventMetadata[] | undefined {
    return this.reflector.get(EVENT_LISTENER_METADATA, target);
  }
}
