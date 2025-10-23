#!/usr/bin/env node
/*
Simple backfill script: copies existing `name` fields into `name_en` for Product and Brand.
Run this after you apply the migration and run `npx prisma generate`.
*/
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting backfill: copying name -> name_en for products and brands');

  const brands = await prisma.brand.findMany();
  for (const b of brands) {
    if (!b.name_en) {
      await prisma.brand.update({ where: { id: b.id }, data: { name_en: b.name } });
    }
  }
  console.log(`Backfilled ${brands.length} brands (when missing).`);

  const products = await prisma.product.findMany();
  for (const p of products) {
    if (!p.name_en) {
      await prisma.product.update({ where: { id: p.id }, data: { name_en: p.name } });
    }
  }
  console.log(`Backfilled ${products.length} products (when missing).`);

  console.log('Backfill completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
