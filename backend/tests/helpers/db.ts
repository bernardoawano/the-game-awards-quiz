import { prisma } from '../../src/lib/prisma';

export async function resetUserData(): Promise<void> {
  await prisma.quizAttempt.deleteMany();
  await prisma.user.deleteMany();
}
