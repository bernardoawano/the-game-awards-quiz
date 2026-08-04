import { Router } from 'express';

import * as catalogController from '../controllers/catalog.controller';
import { validate } from '../middlewares/validate';
import { categoriesQuerySchema, nominationsQuerySchema } from '../schemas/catalog.schema';

export const catalogRoutes = Router();

catalogRoutes.use((_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});

catalogRoutes.get('/years', catalogController.getYears);
catalogRoutes.get('/categories', validate(categoriesQuerySchema, 'query'), catalogController.getCategories);
catalogRoutes.get('/nominations', validate(nominationsQuerySchema, 'query'), catalogController.getNominations);
