import type { Request, Response } from 'express';

import type { CategoriesQuery, NominationsQuery } from '../schemas/catalog.schema';
import * as catalogService from '../services/catalog.service';

export async function getYears(_req: Request, res: Response): Promise<void> {
  const years = await catalogService.getYears();
  res.status(200).json(years);
}

export async function getCategories(_req: Request, res: Response): Promise<void> {
  const query = res.locals.validated as CategoriesQuery;
  const categories = await catalogService.getCategories(query.year);
  res.status(200).json(categories);
}

export async function getNominations(_req: Request, res: Response): Promise<void> {
  const query = res.locals.validated as NominationsQuery;
  const nominations = await catalogService.getNominations(query);
  res.status(200).json(nominations);
}
