import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import ViteYaml from '@modyfi/vite-plugin-yaml';
import path from 'path';

export default defineConfig({
  plugins: [
    vue(),
    ViteYaml(),
    AutoImport({
      imports: [
        'vue',
        'pinia',
        '@vueuse/core',
      ],
      dts: 'auto-imports-cs.d.ts',
    }),
    Components({
      dirs: ['src/自定义开局/components', 'src/自定义开局/steps'],
      dts: 'components-cs.d.ts',
    }),
    viteSingleFile({
      removeViteModuleLoader: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@util': path.resolve(__dirname, 'util'),
      'lodash': 'lodash-es',
      'zod': path.resolve(__dirname, 'util/zod-bridge.ts'),
    },
  },
  root: 'src/自定义开局',
  build: {
    outDir: path.resolve(__dirname, 'dist/自定义开局'),
    emptyOutDir: true,
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
  },
});
