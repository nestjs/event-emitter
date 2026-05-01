import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { EventEmitter2 } from 'eventemitter2';
import { EVENT_EMITTER_MODULE_OPTIONS } from './constants.js';
import { EventEmitterReadinessWatcher } from './event-emitter-readiness.watcher.js';
import { EventSubscribersLoader } from './event-subscribers.loader.js';
import { EventsMetadataAccessor } from './events-metadata.accessor.js';
import { EventEmitterModuleOptions } from './interfaces/index.js';

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
