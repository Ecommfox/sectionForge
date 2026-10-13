import { Router } from 'express';
import { AppError } from '../lib/errors';
import { builderRouter } from './builder';
import { shopifyRouter } from './shopify';

export const apiRouter = Router();

apiRouter.use('/builder', builderRouter);
apiRouter.use('/shopify', shopifyRouter);
apiRouter.use((_request, _response, next) => {
  next(new AppError('API route not found.', 'NOT_FOUND', 404));
});
