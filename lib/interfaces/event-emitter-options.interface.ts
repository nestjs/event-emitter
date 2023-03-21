import { ConstructorOptions } from 'eventemitter2';

/**
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
}
