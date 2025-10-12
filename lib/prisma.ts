import { PrismaClient } from "@prisma/client";

// Prevent multiple instances of Prisma Client in development
// See: https://www.prisma.io/docs/support/help-articles/nextjs-prisma-client-dev-practices
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;
