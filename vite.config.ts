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
      dts: 'auto-imports.d.ts',
    }),
    Components({
      dirs: ['src/修仙状态栏/pages'],
      dts: 'components.d.ts',
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
    },
  },
  root: 'src/修仙状态栏',
  build: {
    outDir: path.resolve(__dirname, 'dist/修仙状态栏'),
    emptyOutDir: true,
    target: 'esnext',
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    cssCodeSplit: false,
    buiIdOptions: {},
  },
});
