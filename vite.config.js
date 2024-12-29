import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './htmls_folder', // Specify the root folder containing index.html
  build: {
    outDir: '../dist', // Output directory
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, './htmls_folder/index.html'),
      },
    },
  },
  server: {
    port: 3000, // Development server port
  },
});

