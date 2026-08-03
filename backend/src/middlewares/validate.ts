import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';

import { AppError } from '../errors/AppError';

type ValidationSource = 'body' | 'params' | 'query';

export function validate(schema: ZodType, source: ValidationSource = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(AppError.validation('Dados inválidos. Verifique os campos enviados.'));
      return;
    }

    res.locals.validated = result.data;
    next();
  };
}
