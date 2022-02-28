import { SetMetadata } from '@nestjs/common';
import { EVENT_LISTENER_METADATA } from '../constants';
import { OnEventOptions } from '../interfaces';

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
 * Event listener decorator.
 * Subscribes to events based on the specified name(s).
 *
 * @param name event to subscribe to
 */
export const OnEvent = (
  event: string | symbol | Array<string | symbol>,
  options?: OnEventOptions,
): MethodDecorator =>
  SetMetadata(EVENT_LISTENER_METADATA, { event, options } as OnEventMetadata);
