import { extendArrayMetadata } from '@nestjs/common/utils/extend-metadata.util';
import { EVENT_LISTENER_METADATA } from '../constants';
import { OnEventOptions } from '../interfaces';
import { Logger } from '@nestjs/common';

/**
 * `@OnEvent` decorator metadata
 */
export interface OnEventMetadata {
  /**
   * Event (name or pattern) to subscribe to.
   */
  event: string | symbol | Array<string | symbol>;
  /**
   * Subscription options.
   */
  options?: OnEventOptions;
}

/**
 * `@OnEvent` decorator event type
 */
export type OnEventType = string | symbol | Array<string | symbol>;

/**
 * Event listener decorator.
 * Subscribes to events based on the specified name(s).
 *
 * @param event event to subscribe to
 */
export const OnEvent = (
  event: OnEventType,
  options?: OnEventOptions,
): MethodDecorator => {
  const decoratorFactory = (target: object, key?: any, descriptor?: any) => {
    const logger = new Logger('OnEvent');
    const originMethod = descriptor.value;
    const metaKeys = Reflect.getOwnMetadataKeys(descriptor.value);
    const metas = metaKeys.map(key => [
      key,
      Reflect.getMetadata(key, descriptor.value),
    ]);
    descriptor.value = async function (...args: any[]) {
      try {
        await originMethod.call(this, ...args);
      } catch (error) {
        if (error instanceof Error) {
          logger.error(error, error.stack);
        } else {
          logger.error(error);
        }
      }
    };
    metas.forEach(([k, v]) => Reflect.defineMetadata(k, v, descriptor.value));

    extendArrayMetadata(
      EVENT_LISTENER_METADATA,
      [{ event, options } as OnEventMetadata],
      descriptor.value,
    );
    return descriptor;
  };
  decoratorFactory.KEY = EVENT_LISTENER_METADATA;
  return decoratorFactory;
};
