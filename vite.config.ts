import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  build: { minify: false },
  plugins: [monkey({
    entry: 'src/zai-local-time.user.ts',
    userscript: {
      name: 'z.ai Local Time',
      namespace: 'zai-local-time',
      version: '0.1.0',
      description: 'Adds your local time beside z.ai Coding Plan reset times.',
      match: ['https://z.ai/*'],
      grant: 'none',
      'run-at': 'document-idle',
      noframes: true,
    },
    build: { fileName: 'zai-local-time.user.js' },
  })],
});
