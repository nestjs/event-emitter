import type { Provider } from '@nestjs/common';

export const TEST_PROVIDER_TOKEN = 'TEST_PROVIDER';

export const TestProvider: Provider = {
  provide: TEST_PROVIDER_TOKEN,
  useFactory: () => {
    const testProvidedValue = {
      a: 5,
      b: 7,
    };
    return testProvidedValue;
  },
};
