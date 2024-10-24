import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: '.', 
  server: {
    proxy: {
      '/apii': 'http://localhost:5002', 
    }
  },
  css: {
    postcss: path.resolve(__dirname, './configs/postcss.config.js') 
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'), 
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html')  
    }
  }
});
