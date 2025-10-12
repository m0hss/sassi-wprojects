const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const dbFile = path.join(__dirname, '..', 'public', 'products.db');
  console.log('Using DB file:', dbFile);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbFile}`,
      },
    },
  });

  try {
    await prisma.$connect();
    console.log('Prisma connected');
    const count = await prisma.product.count();
    console.log('product count:', count);
  } catch (err) {
    console.error('Prisma error:');
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 2;
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }
}

main();
