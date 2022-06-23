import { Module } from '@nestjs/common';
import { EventEmitterModule } from '../../lib';
import { EventsControllerConsumer } from './events-controller.consumer';
import { EventsProviderPrependConsumer } from './events-provider-prepend.consumer';
import { EventsProviderConsumer } from './events-provider.consumer';
import { EventsProducer } from './events.producer';
import { TestProvider } from './test-provider';
import {EventsProducerScoped} from "./events.producer-scoped";
import {EventsProviderConsumerScoped, ServiceHandler} from "./events-provider-scoped.consumer";

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
    EventsProducerScoped,
    EventsProviderConsumerScoped,
    ServiceHandler
  ],
})
export class AppModule {}
