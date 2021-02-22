import { Module } from '@nestjs/common';
import { EventEmitterModule } from '../../lib';
import { EventsControllerConsumer } from './events-controller.consumer';
import { EventsProviderConsumer } from './events-provider.consumer';
import { EventsProducer } from './events.producer';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
  ],
  controllers: [EventsControllerConsumer],
  providers: [EventsProviderConsumer, EventsProducer],
})
export class AppModule {}
