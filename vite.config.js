import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sectionforge-api',
      async configureServer(server) {
        const { default: app } = await server.ssrLoadModule('/server/index.ts');
        server.middlewares.use(app);
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
  }
});
