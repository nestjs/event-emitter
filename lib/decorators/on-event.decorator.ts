import { SetMetadata } from '@nestjs/common';
import { OnOptions } from 'eventemitter2';
import { EVENT_LISTENER_METADATA } from '../constants';

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
  options?: OnOptions;
}

/**
 * Event listener decorator.
 * Subscribes to events based on the specified name(s).
 *
 * @param name event to subscribe to
 */
export const OnEvent = (
  event: string | symbol | Array<string | symbol>,
  options?: OnOptions,
): MethodDecorator =>
  SetMetadata(EVENT_LISTENER_METADATA, { event, options } as OnEventMetadata);
