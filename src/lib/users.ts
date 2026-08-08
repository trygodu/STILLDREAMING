import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function userCount(): Promise<number> {
  return prisma.user.count();
}

export async function createUser(email: string, password: string, name?: string | null) {
  return prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      name: name?.trim() || null,
      passwordHash: hashPassword(password),
    },
  });
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null;
  return verifyPassword(password, user.passwordHash) ? user : null;
}
