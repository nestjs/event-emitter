import { ConstructorOptions } from 'eventemitter2';

/**
 * Options for the `EventEmitterModule`.
 *
 * @publicApi
 */
export interface EventEmitterModuleOptions extends ConstructorOptions {
  /**
   * If "true", registers `EventEmitterModule` as a global module.
   * See: https://docs.nestjs.com/modules#global-modules
   *
   * @default true
   */
  global?: boolean;
  /**
   * If "true", request-scoped event listeners resolve the context id
   * directly from the original request payload using
   * `ContextIdFactory.getByRequest(request)`. This lets the listener share
   * the same context id as the originating HTTP request and reuse providers
   * from the existing dependency tree.
   *
   * If "false" (default), the request payload is wrapped as
   * `{ payload: request }` (`EventPayloadHost`) before resolution, which
   * preserves the original behavior and resolves the listener context
   * independently from the originating request context.
   *
   * See: https://github.com/nestjs/event-emitter/issues/1622
   *
   * @default false
   */
  inheritRequestContextId?: boolean;
}
