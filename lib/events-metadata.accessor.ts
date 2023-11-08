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
    // Circumvent a crash that comes from reflect-metadata if it is
    // given a non-object non-function target to reflect upon.
    if (
      !target ||
      (typeof target !== 'function' && typeof target !== 'object')
    ) {
      return undefined;
    }

    const metadata = this.reflector.get(EVENT_LISTENER_METADATA, target);
    if (!metadata) {
      return undefined;
    }
    return Array.isArray(metadata) ? metadata : [metadata];
  }
}
