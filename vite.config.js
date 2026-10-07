import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sectionforge-api',
      configureServer(server) {
        // Mock / proxy endpoints for conversion & shopify preview test
        server.middlewares.use('/api/shopify/preview', async (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const data = JSON.parse(body || '{}');
                const previewId = 'sf-' + Math.random().toString(36).substring(2, 9);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: true,
                  previewId,
                  sectionName: data.name || 'Hero Banner',
                  previewUrl: `https://dev-theme-store.myshopify.com?preview_theme_id=140924080312&section_id=${previewId}`,
                  expiresIn: '24 hours'
                }));
              } catch (e) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
              }
            });
            return;
          }
          res.statusCode = 404;
          res.end('Not found');
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
