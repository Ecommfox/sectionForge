import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sectionforge-api',
      async configureServer(server) {
        const { handleRequest } = await server.ssrLoadModule('/server/index.ts');

        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api/')) {
            next();
            return;
          }

          try {
            const chunks = [];
            let bodyBytes = 0;
            let oversized = false;
            if (req.method !== 'GET' && req.method !== 'HEAD') {
              for await (const chunk of req) {
                const buffer = Buffer.from(chunk);
                bodyBytes += buffer.byteLength;
                if (bodyBytes > 64 * 1024) {
                  oversized = true;
                  chunks.length = 0;
                } else if (!oversized) {
                  chunks.push(buffer);
                }
              }
            }
            const body = oversized ? ' '.repeat(64 * 1024 + 1) : Buffer.concat(chunks).toString('utf8');
            const headers = new Headers();
            const contentType = req.headers['content-type'];
            if (typeof contentType === 'string') {
              headers.set('Content-Type', contentType);
            }

            const request = new Request(new URL(req.url, 'http://localhost'), {
              method: req.method,
              headers,
              ...((req.method !== 'GET' && req.method !== 'HEAD') ? { body } : {})
            });
            const response = await handleRequest(request);
            res.statusCode = response.status;
            response.headers.forEach((value, name) => res.setHeader(name, value));
            res.end(Buffer.from(await response.arrayBuffer()));
          } catch (error) {
            next(error);
          }
        });
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
  }
});
