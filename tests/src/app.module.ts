import { Module } from '@nestjs/common';
import { EventEmitterModule } from '../../lib/index.js';
import { CustomEventDecoratorConsumer } from './custom-decorator-test.consumer.js';
import { EventsControllerConsumer } from './events-controller.consumer.js';
import { EventsProviderAliasedConsumer } from './events-provider-aliased.consumer.js';
import { EventsProviderPrependConsumer } from './events-provider-prepend.consumer.js';
import { EventsProviderConsumer } from './events-provider.consumer.js';
import { EventsProviderDurableRequestScopedConsumer } from './events-provider.durable-request-scoped.consumer.js';
import { EventsProviderRequestScopedConsumer } from './events-provider.request-scoped.consumer.js';
import { EventsProducer } from './events.producer.js';
import { TestProvider } from './test-provider.js';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
  ],
  controllers: [EventsControllerConsumer],
  providers: [
    EventsProviderConsumer,
    EventsProviderPrependConsumer,
    EventsProducer,
    TestProvider,
    EventsProviderRequestScopedConsumer,
    EventsProviderDurableRequestScopedConsumer,
    EventsProviderAliasedConsumer,
    {
      provide: 'AnAliasedConsumer',
      useExisting: EventsProviderAliasedConsumer,
    },
    CustomEventDecoratorConsumer,
  ],
})
export class AppModule {}
