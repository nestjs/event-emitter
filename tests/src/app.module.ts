import { Module } from '@nestjs/common';
import { EventEmitterModule } from '../../lib';
import { EventsConsumer } from './events.consumer';
import { EventsProducer } from './events.producer';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
    }),
  ],
  providers: [EventsConsumer, EventsProducer],
})
export class AppModule {}
