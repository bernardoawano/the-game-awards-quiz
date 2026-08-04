import { prisma } from '../../src/lib/prisma';

describe('seed', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('creates exactly 805 nominations', async () => {
    expect(await prisma.nomination.count()).toBe(805);
  });

  it('creates exactly 154 quiz questions', async () => {
    expect(await prisma.quizQuestion.count()).toBe(154);
  });

  it('every quiz question points to a winning nomination in the same (year, categoryId)', async () => {
    const questions = await prisma.quizQuestion.findMany({ include: { correctNomination: true } });
    for (const question of questions) {
      expect(question.correctNomination.isWinner).toBe(true);
      expect(question.correctNomination.year).toBe(question.year);
      expect(question.correctNomination.categoryId).toBe(question.categoryId);
    }
  });

  it('has no quiz question for any of the 9 ineligible combos', async () => {
    const ineligibleCombos = [
      { year: 2014, canonicalName: 'Best Esports Team' },
      { year: 2014, canonicalName: 'Trending Gamer' },
      { year: 2014, canonicalName: 'Industry Icon Award' },
      { year: 2015, canonicalName: 'Industry Icon Award' },
      { year: 2016, canonicalName: 'Best Esports Game' },
      { year: 2016, canonicalName: 'Industry Icon Award' },
      { year: 2017, canonicalName: 'Industry Icon Award' },
      { year: 2018, canonicalName: 'Industry Icon Award' },
      { year: 2019, canonicalName: 'Global Gaming Citizens' },
    ];

    for (const combo of ineligibleCombos) {
      const category = await prisma.category.findUnique({ where: { canonicalName: combo.canonicalName } });
      if (category === null) throw new Error(`Categoria não encontrada: ${combo.canonicalName}`);
      const question = await prisma.quizQuestion.findFirst({ where: { year: combo.year, categoryId: category.id } });
      expect(question).toBeNull();
    }
  });
});
