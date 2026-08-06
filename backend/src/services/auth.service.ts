import { compare, hash } from 'bcrypt';

import { AppError } from '../errors/AppError';
import { Prisma } from '../generated/prisma/client';
import { signAuthToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';

const BCRYPT_ROUNDS = 12;

export async function register(input: RegisterInput): Promise<{ userId: number; token: string }> {
  const passwordHash = await hash(input.password, BCRYPT_ROUNDS);

  try {
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash },
      select: { id: true },
    });
    return { userId: user.id, token: signAuthToken(user.id) };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw AppError.emailAlreadyExists();
    }
    throw error;
  }
}

export async function login(input: LoginInput): Promise<{ userId: number; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, passwordHash: true },
  });

  if (user === null) {
    throw AppError.invalidCredentials();
  }

  const passwordMatches = await compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw AppError.invalidCredentials();
  }

  return { userId: user.id, token: signAuthToken(user.id) };
}

export async function getCurrentUser(
  userId: number,
): Promise<{ id: number; email: string; createdAt: Date } | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  });
}
