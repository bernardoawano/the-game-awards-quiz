import * as z from 'zod';

export const categoriesQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
});
export type CategoriesQuery = z.infer<typeof categoriesQuerySchema>;

export const nominationsQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  categoryId: z.coerce.number().int().optional(),
});
export type NominationsQuery = z.infer<typeof nominationsQuerySchema>;
