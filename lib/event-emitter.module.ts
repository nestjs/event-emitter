import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { EventEmitter2 } from 'eventemitter2';
import { EVENT_EMITTER_MODULE_OPTIONS } from './constants';
import { EventEmitterReadinessWatcher } from './event-emitter-readiness.watcher';
import { EventSubscribersLoader } from './event-subscribers.loader';
import { EventsMetadataAccessor } from './events-metadata.accessor';
import { EventEmitterModuleOptions } from './interfaces';

/**
 * @publicApi
 */
@Module({})
export class EventEmitterModule {
  static forRoot(options?: EventEmitterModuleOptions): DynamicModule {
    return {
      global: options?.global ?? true,
      module: EventEmitterModule,
      imports: [DiscoveryModule],
      providers: [
        EventSubscribersLoader,
        EventsMetadataAccessor,
        EventEmitterReadinessWatcher,
        {
          provide: EVENT_EMITTER_MODULE_OPTIONS,
          useValue: options ?? {},
        },
        {
          provide: EventEmitter2,
          useFactory: () => new EventEmitter2(options),
        },
      ],
      exports: [EventEmitter2, EventEmitterReadinessWatcher],
    };
  }
}
