import { Injectable, Scope } from '@nestjs/common';
import { OnEvent } from '../../lib/index.js';

@Injectable({ scope: Scope.REQUEST })
export class FailingRequestScopedDependency {
  constructor() {
    throw new Error('This is a test instantiation error');
  }
}

@Injectable({ scope: Scope.REQUEST })
export class EventsProviderRequestScopedFailingConsumer {
  constructor(private readonly dependency: FailingRequestScopedDependency) {}

  @OnEvent('instantiation-error-handling-suppressed.request-scoped')
  onSuppressedEvent() {}

  @OnEvent('instantiation-error-throwing.request-scoped', {
    suppressErrors: false,
  })
  onThrowingEvent() {}
}
