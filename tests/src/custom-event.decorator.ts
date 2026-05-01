import { SetMetadata } from '@nestjs/common';

import { EVENT_LISTENER_METADATA, OnEventMetadata } from '../../lib/index.js';

import type { OnEventOptions } from '../../lib/index.js';

export const CustomEvent = (event: string, options?: OnEventOptions) =>
  SetMetadata(EVENT_LISTENER_METADATA, {
    event,
    options,
  } as OnEventMetadata);
