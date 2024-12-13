import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff'
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/theme.scss" as *;`,
        javascriptEnabled: true
      }
    }
  }
});
