import express from 'express';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { requestContext } from './middleware/requestContext';

export function createApp(staticDirectory?: string) {
  const app = express();

  app.use(
    '/api',
    requestContext,
    requestLogger,
    express.json({ limit: '64kb' }),
    apiRouter
  );

  if (staticDirectory) {
    app.use(express.static(staticDirectory));
    app.get(/^\/(?!api(?:\/|$)).*/, (_request, response, next) => {
      response.sendFile('index.html', { root: staticDirectory }, next);
    });
  }

  app.use(errorHandler);
  return app;
}

export default createApp();
