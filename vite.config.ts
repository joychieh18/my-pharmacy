import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/my-pharmacy/',
  build: {
    rollupOptions: {
      input: {
        game: resolve('index.html'),
        admin: resolve('admin/index.html'),
      },
    },
  },
});
