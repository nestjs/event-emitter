import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { DiscoveryService, MetadataScanner, ModuleRef} from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { EventEmitter2 } from 'eventemitter2';
import { EventsMetadataAccessor } from './events-metadata.accessor';
import { ScopedEvent } from "./scopedEventEmitter";

function unwrapEvent(event: ScopedEvent | any): any {
  return event instanceof ScopedEvent ? event.event : event;
}

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

    // Iterate over wrapped declarations of providers and controllers.
    [...providers, ...controllers]
      .forEach((wrapper: InstanceWrapper) => {
          // Check if dependency tree is static for instance (All injectables are DEFAULT or TRANSIENT).
          // And instance has already been created for static tree.
          // Treat this as singleton.
          if (wrapper.isDependencyTreeStatic() && wrapper.instance) {
            this.subscribeSingleton(wrapper);
          } else {
            // Otherwise we do more complex handler subscription
            this.subscribeScoped(wrapper);
          }
      });

  }

  private subscribeScoped(wrapper: InstanceWrapper) {
    // There is no instance created, so let's create one for method analysis.
    const prototype = wrapper.metatype.prototype;
    if(!prototype)
      return;
    const instanceForAnalysis = Object.create(prototype);
    this.subscribeAllListeners(instanceForAnalysis,
      prototype,
    async (args: any[]): Promise<any> => {
        // We should have an event to unwrap.
        if(args.length === 0)
          return;
        // Grab context form first event.
        const event: any = args[0];
        // We don't handle non-scoped events, because they were not fired in scope and we don't know the context to handle them.
        if (!(event instanceof ScopedEvent))
          return;
        // To resolve a class instance from NestJS container with context we need to get the module.
        // Wrapper has reference to module.
        const moduleRef = wrapper.host!.getProviderByKey<ModuleRef>(ModuleRef).instance;
        // Create or get the instance from container within the context
        return moduleRef.resolve(wrapper.metatype, event.context);
      }
    );
  }

  private subscribeSingleton(wrapper: InstanceWrapper) {
    const { instance } = wrapper;
    const prototype = Object.getPrototypeOf(instance) || {};
    this.subscribeAllListeners(instance, prototype, () => Promise.resolve(instance));
  }

  private subscribeAllListeners(
    instance: Record<string, any>,
    prototype: any,
    getInstanceFunc: (args: any[]) => Promise<any>
  ): void {
    if(!(prototype && instance))
      return;
    this.metadataScanner.scanFromPrototype(
        instance,
        prototype,
        methodKey => {
      const method = instance[methodKey];
      // If method is private or not accessible skip it
      if (!method)
        return;
      const metadata = this.metadataAccessor.getEventHandlerMetadata(method);
      if (!metadata)
        return;
      // If there is no metadata for handling events - skip method
      const { event, options } = metadata;
      const listenerMethod = !!options?.prependListener
                  ? this.eventEmitter.prependListener.bind(this.eventEmitter)
                  : this.eventEmitter.on.bind(this.eventEmitter);
      const handler = async (...args: any[]) => {
        const inst = await getInstanceFunc(args);
        // In case no handling instance is resolved - skip handling
        if(!inst) return;
        return method.call(inst, ...args.map(unwrapEvent));
      };
      // Subscribe to event with wrapped handler
      listenerMethod(event, handler, options);
    });
  }
}
