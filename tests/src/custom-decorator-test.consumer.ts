import { Injectable } from '@nestjs/common';
import { CUSTOM_DECORATOR_EVENT } from './custom-decorator-test.constants';
import { CustomEvent } from './custom-event.decorator';

@Injectable()
export class CustomEventDecoratorConsumer {
  public isEmitted = false;

  @CustomEvent(CUSTOM_DECORATOR_EVENT)
  handleCustomEvent() {
    this.isEmitted = true;
  }
}
