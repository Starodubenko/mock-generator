import { createRequire } from 'node:module';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const { viteAliasEntries } = createRequire(import.meta.url)(
  './scripts/layer-aliases.cjs',
) as {
  viteAliasEntries: (srcRoot: string) => Array<{
    find: string | RegExp;
    replacement: string;
  }>;
};

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react({})],
  resolve: {
    alias: viteAliasEntries(resolve(__dirname, 'src')),
    dedupe: ['react', 'react-dom', '@nestjs-ssr/react'],
  },
  ssr: {
    noExternal: ['@nestjs-ssr/react'],
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
  build: {
    outDir: isSsrBuild ? './dist/server' : './dist/client',
    manifest: true,
    rollupOptions: {
      input: !isSsrBuild
        ? {
            client: resolve(__dirname, 'src/views/entry-client.tsx'),
          }
        : undefined,
      external: (id: string) => {
        if (id.includes('/fsevents') || id.endsWith('fsevents')) {
          return true;
        }
        if (id.endsWith('.node')) {
          return true;
        }
        return false;
      },
    },
  },
}));
