import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Optional,
} from '@nestjs/common';
import {
  ContextIdFactory,
  DiscoveryService,
  MetadataScanner,
  ModuleRef,
} from '@nestjs/core';
import { Injector } from '@nestjs/core/injector/injector.js';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper.js';
import { Module } from '@nestjs/core/injector/module.js';
import {
  DEFAULT_LISTENER_PRIORITY,
  EVENT_EMITTER_MODULE_OPTIONS,
} from './constants.js';
import { EventEmitter2 } from './eventemitter2.js';
import { EventEmitterReadinessWatcher } from './event-emitter-readiness.watcher.js';
import { EventsMetadataAccessor } from './events-metadata.accessor.js';
import {
  EventEmitterModuleOptions,
  OnEventOptions,
} from './interfaces/index.js';
import { EventPayloadHost } from './interfaces/event-payload-host.interface.js';
import { EventSubscription } from './interfaces/event-subscription.interface.js';

@Injectable()
export class EventSubscribersLoader
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly injector = new Injector();
  private readonly logger = new Logger('Event');

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly metadataAccessor: EventsMetadataAccessor,
    private readonly metadataScanner: MetadataScanner,
    private readonly moduleRef: ModuleRef,
    private readonly eventEmitterReadinessWatcher: EventEmitterReadinessWatcher,
    @Optional()
    @Inject(EVENT_EMITTER_MODULE_OPTIONS)
    private readonly options: EventEmitterModuleOptions = {},
  ) {}

  onApplicationBootstrap() {
    try {
      this.loadEventListeners();
      this.eventEmitterReadinessWatcher.setReady();
    } catch (e) {
      this.eventEmitterReadinessWatcher.setErrored(e as Error);
    }
  }

  onApplicationShutdown() {
    this.eventEmitter.removeAllListeners();
  }

  loadEventListeners() {
    const subscriptions: EventSubscription[] = [];
    const providers = this.discoveryService.getProviders();
    const controllers = this.discoveryService.getControllers();
    [...providers, ...controllers]
      .filter(wrapper => wrapper.instance && !wrapper.isAlias)
      .forEach((wrapper: InstanceWrapper) => {
        const { instance } = wrapper;
        const prototype = Object.getPrototypeOf(instance) || {};
        const isRequestScoped = !wrapper.isDependencyTreeStatic();
        this.metadataScanner
          .getAllMethodNames(prototype)
          .forEach(methodKey =>
            this.subscribeToEventIfListener(
              instance,
              methodKey,
              isRequestScoped,
              wrapper.host as Module,
              subscriptions,
            ),
          );
      });
    this.registerSubscriptions(subscriptions);
  }

  private subscribeToEventIfListener(
    instance: Record<string, any>,
    methodKey: string,
    isRequestScoped: boolean,
    moduleRef: Module,
    subscriptions: EventSubscription[],
  ) {
    const eventListenerMetadatas =
      this.metadataAccessor.getEventHandlerMetadata(instance[methodKey]);
    if (!eventListenerMetadatas) {
      return;
    }

    for (const eventListenerMetadata of eventListenerMetadatas) {
      const { event, options } = eventListenerMetadata;
      subscriptions.push({
        priority: this.listenerPriority(options),
        prepend: options?.prependListener ?? false,
        order: subscriptions.length,
        register: () => {
          const listenerMethod = this.getRegisterListenerMethodBasedOn(options);

          if (isRequestScoped) {
            this.registerRequestScopedListener({
              event,
              eventListenerInstance: instance,
              listenerMethod,
              listenerMethodKey: methodKey,
              moduleRef,
              options,
            });
            return;
          }

          listenerMethod(
            event,
            (...args: unknown[]) =>
              this.wrapFunctionInTryCatchBlocks(
                instance,
                methodKey,
                args,
                options,
              ),
            options,
          );
        },
      });
    }
  }

  /**
   * Registers every `@OnEvent` listener after sorting. `prependListener`
   * inserts at the front, so that group is registered from the lowest
   * priority to the highest, and its ties are called in reverse discovery
   * order, as they were before priorities existed. The other group is
   * registered from the highest priority to the lowest, and its ties are
   * called in discovery order.
   */
  private registerSubscriptions(subscriptions: EventSubscription[]) {
    const prepended = subscriptions.filter(item => item.prepend);
    const appended = subscriptions.filter(item => !item.prepend);

    prepended.sort(
      (left, right) =>
        this.comparePriorities(left.priority, right.priority) ||
        left.order - right.order,
    );
    appended.sort(
      (left, right) =>
        this.comparePriorities(right.priority, left.priority) ||
        left.order - right.order,
    );

    for (const subscription of prepended) {
      subscription.register();
    }
    for (const subscription of appended) {
      subscription.register();
    }
  }

  /**
   * Compares without subtracting, so that two `Infinity` (or two `-Infinity`)
   * priorities are a tie rather than `NaN`.
   */
  private comparePriorities(left: number, right: number): number {
    if (left === right) {
      return 0;
    }
    return left < right ? -1 : 1;
  }

  private listenerPriority(options?: OnEventOptions): number {
    const priority = options?.priority;
    if (typeof priority === 'number' && !Number.isNaN(priority)) {
      return priority;
    }
    return DEFAULT_LISTENER_PRIORITY;
  }

  private getRegisterListenerMethodBasedOn(options?: OnEventOptions) {
    return options?.prependListener
      ? this.eventEmitter.prependListener.bind(this.eventEmitter)
      : this.eventEmitter.on.bind(this.eventEmitter);
  }

  private registerRequestScopedListener(eventListenerContext: {
    listenerMethod: EventEmitter2['on'];
    event: string | symbol | (string | symbol)[];
    eventListenerInstance: Record<string, any>;
    moduleRef: Module;
    listenerMethodKey: string;
    options?: OnEventOptions;
  }) {
    const {
      listenerMethod,
      event,
      eventListenerInstance,
      moduleRef,
      listenerMethodKey,
      options,
    } = eventListenerContext;

    listenerMethod(
      event,
      async (...args: unknown[]) => {
        const request = this.getRequestFromEventPayload(args);
        // When `inheritRequestContextId` is enabled, resolve the context id
        // directly from the original request so that listeners emitted within
        // an existing request scope reuse the same dependency tree (#1622).
        // Otherwise, preserve the original wrapper-based behavior.
        const contextId = this.options.inheritRequestContextId
          ? ContextIdFactory.getByRequest(request as Record<string, unknown>)
          : ContextIdFactory.getByRequest<EventPayloadHost<unknown>>({
              payload: request,
            });

        this.moduleRef.registerRequestByContextId(request, contextId);

        let contextInstance: Record<string, (...args: unknown[]) => unknown>;
        try {
          contextInstance = await this.injector.loadPerContext(
            eventListenerInstance,
            moduleRef,
            moduleRef.providers,
            contextId,
          );
        } catch (e) {
          if (!(options?.suppressErrors ?? true)) {
            throw e;
          }
          const error = e as Error;
          this.logger.error(error.message, error.stack);
          return;
        }
        return this.wrapFunctionInTryCatchBlocks(
          contextInstance,
          listenerMethodKey,
          args,
          options,
        );
      },
      options,
    );
  }

  private getRequestFromEventPayload(eventPayload: unknown[]): unknown {
    /*
      **Required explanation for the ternary below**

      We need the conditional below because an event can be emitted with a variable amount of arguments.
      For instance, we can do `this.eventEmitter.emit('event', 'payload1', 'payload2', ..., 'payloadN');`

      All payload arguments are internally stored as an array. So, imagine we emitted an event as follows:

      `this.eventEmitter.emit('event', 'payload');

      if we registered the original `eventPayload`, when we try to inject it in a listener, it'll be retrieved as [`payload`].
      However, whoever is using this library would certainly expect the event payload to be a single string 'payload', not an array,
      since this is what we emitted above.
    */
    return eventPayload.length > 1 ? eventPayload : eventPayload[0];
  }

  private async wrapFunctionInTryCatchBlocks(
    instance: Record<string, (...args: unknown[]) => unknown>,
    methodKey: string,
    args: unknown[],
    options?: OnEventOptions,
  ) {
    try {
      return await instance[methodKey].call(instance, ...args);
    } catch (e) {
      if (options?.suppressErrors ?? true) {
        const error = e as Error;
        this.logger.error(error.message, error.stack);
      } else {
        throw e;
      }
    }
  }
}
