import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";

export async function findClientByEmail(email: string) {
  return prisma.client.findUnique({ where: { email: email.trim().toLowerCase() } });
}

export async function createClient(input: {
  name?: string | null;
  email: string;
  password: string;
  website?: string | null;
  company?: string | null;
  leadId?: string | null;
}) {
  return prisma.client.create({
    data: {
      name: input.name?.trim() || null,
      email: input.email.trim().toLowerCase(),
      passwordHash: hashPassword(input.password),
      website: input.website || null,
      company: input.company?.trim() || null,
      leadId: input.leadId ?? null,
    },
  });
}

export async function verifyClientCredentials(email: string, password: string) {
  const client = await findClientByEmail(email);
  if (!client) return null;
  return verifyPassword(password, client.passwordHash) ? client : null;
}
