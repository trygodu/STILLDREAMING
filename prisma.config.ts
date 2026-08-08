import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Used by the Prisma CLI only (migrate deploy/dev, generate) — NOT by the
    // running app (see src/lib/db.ts, which reads DATABASE_URL directly).
    // `prisma migrate deploy` needs a direct, unpooled connection (it relies
    // on session-level advisory locks that connection poolers like PgBouncer
    // break), so this prefers DIRECT_URL and falls back to DATABASE_URL when
    // there's only one connection string (e.g. local dev, unpooled Postgres).
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
