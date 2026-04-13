import { defineConfig } from 'vitest/config';

export default defineConfig({
  oxc: {
    decorators: {
      legacy: true,
      emitDecoratorMetadata: true,
    },
  },
  test: {
    globals: true,
    root: './',
    include: ['tests/**/*.spec.ts'],
  },
});
