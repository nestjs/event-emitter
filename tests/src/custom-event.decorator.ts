import { SetMetadata } from '@nestjs/common';

import { OnEventMetadata } from '../../lib';
import { EVENT_LISTENER_METADATA } from '../../lib/constants';

import type { OnEventOptions } from '../../lib/interfaces';

export const CustomEvent = (event: string, options?: OnEventOptions) =>
  SetMetadata(EVENT_LISTENER_METADATA, {
    event,
    options,
  } as OnEventMetadata);
