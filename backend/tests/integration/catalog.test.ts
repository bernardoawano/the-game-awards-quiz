import request from 'supertest';

import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';

describe('catalog endpoints', () => {
  describe('GET /api/years', () => {
    it('returns the 6 seeded years, ascending, with a cache header', async () => {
      const response = await request(app).get('/api/years');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([2014, 2015, 2016, 2017, 2018, 2019]);
      expect(response.headers['cache-control']).toBe('public, max-age=300');
    });
  });

  describe('GET /api/categories', () => {
    it('returns every canonical category when no year filter is given', async () => {
      const total = await prisma.category.count();
      const response = await request(app).get('/api/categories');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(total);
    });

    it('filters to categories with at least one nomination in the given year', async () => {
      const response = await request(app).get('/api/categories?year=2019');
      const expectedCount = await prisma.category.count({ where: { nominations: { some: { year: 2019 } } } });
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(expectedCount);
    });

    it('returns 200 with an empty array for a year with no data', async () => {
      const response = await request(app).get('/api/categories?year=1999');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/nominations', () => {
    it('reveals exactly one isWinner: true for an eligible combo', async () => {
      const question = await prisma.quizQuestion.findFirst();
      if (question === null) throw new Error('Nenhuma quiz_question encontrada — rode o seed antes dos testes.');
      const response = await request(app).get(`/api/nominations?year=${question.year}&categoryId=${question.categoryId}`);
      expect(response.status).toBe(200);
      const winners = (response.body as Array<{ isWinner: boolean }>).filter((n) => n.isWinner === true);
      expect(winners).toHaveLength(1);
    });

    it('returns 200 with an empty array for a nonexistent year', async () => {
      const response = await request(app).get('/api/nominations?year=1999');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });
});
