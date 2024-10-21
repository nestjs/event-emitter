import { Injectable } from '@nestjs/common';
import { promiseWithResolvers } from './utils/promise-with-resolvers';

@Injectable()
export class EventEmitterReadinessWatcher {
  private readonly readyPromise = promiseWithResolvers();

  waitUntilReady() {
    return this.readyPromise.promise;
  }

  setReady() {
    this.readyPromise.resolve();
  }

  setErrored(error: Error) {
    this.readyPromise.reject(error);
  }
}
