import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import {ContextId, ContextIdFactory, DiscoveryService, MetadataScanner, ModuleRef} from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { EventEmitter2 } from 'eventemitter2';
import { EventsMetadataAccessor } from './events-metadata.accessor';
import {ScopedEvent} from "./scopedEventEmitter";

@Injectable()
export class EventSubscribersLoader
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly metadataAccessor: EventsMetadataAccessor,
    private readonly metadataScanner: MetadataScanner,
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
    const ctx = ContextIdFactory.create();

    [...providers, ...controllers]
      .forEach((wrapper: InstanceWrapper) => {
          if (wrapper.isDependencyTreeStatic() && wrapper.instance) {
            this.subscribeSingleton(wrapper);
          } else {
            this.subscribeScoped(wrapper, ctx);
          }
      });
  }

  private subscribeScoped(wrapper: InstanceWrapper, ctx: ContextId) {
    const prototype = wrapper.createPrototype(ctx);
    if(!prototype)
      return;
    const instance = wrapper.getInstanceByContextId(ctx).instance;

    this.metadataScanner.scanFromPrototype(
        instance,
        prototype,
         (methodKey: string) =>
            this.subscribeToEventIfListener(instance, methodKey, async (...args: unknown[]) => {
              if(args.length === 0)
                return;
              const event: any = args[0];
              if (!(event instanceof ScopedEvent))
                return;
              const inst = await wrapper.host!.getProviderByKey<ModuleRef>(ModuleRef).instance.resolve(wrapper.metatype, event.context);
              return inst[methodKey].call(inst, event.event)
            }),
    );
  }

  private subscribeSingleton(wrapper: InstanceWrapper) {
    const {instance} = wrapper;
    const prototype = Object.getPrototypeOf(instance) || {};
    this.metadataScanner.scanFromPrototype(
        instance,
        prototype,
        (methodKey: string) =>
            this.subscribeToEventIfListener(instance, methodKey, (...args: unknown[]) =>
                instance[methodKey].call(instance, ...args.map((a: any) => a instanceof ScopedEvent ? a.event : a))),
    );
  }

  private subscribeToEventIfListener(
    instance: Record<string, any>,
    methodKey: string,
    handler: (...args: unknown[]) => any
  ) {
    if(!instance[methodKey]) {
      return;
    }
    const eventListenerMetadata = this.metadataAccessor.getEventHandlerMetadata(
        instance[methodKey]
    );
    if (!eventListenerMetadata) {
      return;
    }
    const { event, options } = eventListenerMetadata;
    const listenerMethod = !!options?.prependListener
      ? this.eventEmitter.prependListener.bind(this.eventEmitter)
      : this.eventEmitter.on.bind(this.eventEmitter);

    listenerMethod(event, handler, options);
  }
}
