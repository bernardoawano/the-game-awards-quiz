import request from 'supertest';

import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { resetUserData } from '../helpers/db';

interface QuestionBody {
  question: {
    id: number;
    category: { id: number };
    year: number;
    nominations: Array<{ id: number; isWinner?: boolean }>;
  } | null;
}

interface AnswerBody {
  isCorrect: boolean;
}

interface StatsBody {
  answered: number;
}

function extractSetCookie(response: request.Response): string {
  const cookie = response.headers['set-cookie'];
  if (cookie === undefined) {
    throw new Error('Resposta não trouxe Set-Cookie.');
  }
  return cookie;
}

async function registerAndGetCookie(email: string): Promise<string> {
  const response = await request(app).post('/api/auth/register').send({ email, password: 'senha1234' });
  return extractSetCookie(response);
}

describe('quiz flow', () => {
  beforeEach(async () => {
    await resetUserData();
  });

  it('covers register → login → next → answer → stats, and rejects a duplicate answer', async () => {
    const cookie = await registerAndGetCookie('quiz-flow@example.com');

    const nextResponse = await request(app).get('/api/quiz/next').set('Cookie', cookie);
    expect(nextResponse.status).toBe(200);
    const body = nextResponse.body as QuestionBody;
    expect(body.question).not.toBeNull();
    const question = body.question!;
    expect(question.nominations.every((n) => n.isWinner === undefined)).toBe(true);

    const firstNominationId = question.nominations[0]!.id;
    const answerResponse = await request(app)
      .post('/api/quiz/answer')
      .set('Cookie', cookie)
      .send({ questionId: question.id, nominationId: firstNominationId });
    expect(answerResponse.status).toBe(200);
    expect(typeof (answerResponse.body as AnswerBody).isCorrect).toBe('boolean');

    const duplicateResponse = await request(app)
      .post('/api/quiz/answer')
      .set('Cookie', cookie)
      .send({ questionId: question.id, nominationId: firstNominationId });
    expect(duplicateResponse.status).toBe(409);

    const statsResponse = await request(app).get('/api/quiz/stats').set('Cookie', cookie);
    expect(statsResponse.status).toBe(200);
    expect((statsResponse.body as StatsBody).answered).toBe(1);
  });

  it('rejects a nominationId from a different question with 400', async () => {
    const cookie = await registerAndGetCookie('quiz-mismatch@example.com');
    const nextResponse = await request(app).get('/api/quiz/next').set('Cookie', cookie);
    const question = (nextResponse.body as QuestionBody).question!;

    // Busca direto no Prisma um indicado real de uma combinação (ano, categoria)
    // diferente da pergunta atual — testa a checagem de pertencimento de verdade,
    // não só "esse id existe". Mesmo padrão de acesso direto ao Prisma que
    // seed.test.ts já usa em testes de integração.
    const otherNomination = await prisma.nomination.findFirstOrThrow({
      where: { NOT: { year: question.year, categoryId: question.category.id } },
      select: { id: true },
    });

    const response = await request(app)
      .post('/api/quiz/answer')
      .set('Cookie', cookie)
      .send({ questionId: question.id, nominationId: otherNomination.id });
    expect(response.status).toBe(400);
  });

  it('rejects /quiz/next without a cookie with 401', async () => {
    const response = await request(app).get('/api/quiz/next');
    expect(response.status).toBe(401);
  });
});
