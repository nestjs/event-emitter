import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import {
  ContextIdFactory,
  DiscoveryService,
  MetadataScanner,
  ModuleRef,
} from '@nestjs/core';
import { Injector } from '@nestjs/core/injector/injector';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { EventEmitter2 } from 'eventemitter2';
import { EventsMetadataAccessor } from './events-metadata.accessor';

@Injectable()
export class EventSubscribersLoader
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private injector = new Injector();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly metadataAccessor: EventsMetadataAccessor,
    private readonly metadataScanner: MetadataScanner,
    private readonly moduleRef: ModuleRef,
  ) {}

  onApplicationBootstrap() {
    this.loadEventListeners();
  }

  onApplicationShutdown() {
    this.eventEmitter.removeAllListeners();
  }

  loadEventListeners() {
    const providers = this.discoveryService.getProviders();
    const controllers = this.discoveryService.getControllers();
    [...providers, ...controllers]
      .filter(wrapper => wrapper.instance)
      .forEach((wrapper: InstanceWrapper) => {
        const { instance } = wrapper;
        const prototype = Object.getPrototypeOf(instance) || {};
        const isRequestScoped = !wrapper.isDependencyTreeStatic();
        this.metadataScanner.scanFromPrototype(
          instance,
          prototype,
          (methodKey: string) =>
            this.subscribeToEventIfListener(
              instance,
              methodKey,
              isRequestScoped,
              wrapper.host as Module,
            ),
        );
      });
  }

  private async subscribeToEventIfListener(
    instance: Record<string, any>,
    methodKey: string,
    isRequestScoped: boolean,
    moduleRef: Module,
  ) {
    const eventListenerMetadata = this.metadataAccessor.getEventHandlerMetadata(
      instance[methodKey],
    );
    if (!eventListenerMetadata) {
      return;
    }
    const { event, options } = eventListenerMetadata;
    const listenerMethod = !!options?.prependListener
      ? this.eventEmitter.prependListener.bind(this.eventEmitter)
      : this.eventEmitter.on.bind(this.eventEmitter);

    if (isRequestScoped) {
      listenerMethod(
        event,
        async (...args: unknown[]) => {
          const contextId = ContextIdFactory.create();
          this.moduleRef.registerRequestByContextId(
            args.length > 1 ? args : args[0],
            contextId,
          );

          const contextInstance = await this.injector.loadPerContext(
            instance,
            moduleRef,
            moduleRef.providers,
            contextId,
          );
          return contextInstance[methodKey].call(contextInstance, ...args);
        },
        options,
      );
    } else {
      listenerMethod(
        event,
        (...args: unknown[]) => instance[methodKey].call(instance, ...args),
        options,
      );
    }
  }
}
