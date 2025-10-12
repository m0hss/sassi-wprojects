#!/usr/bin/env node
/*
 Precompute blurDataURLs for images under public/products and write a JSON cache
 Usage: node scripts/precompute-blur.js
*/
const fs = require("fs").promises;
const path = require("path");
const { getPlaiceholder } = require("plaiceholder");
const prisma = require("../lib/prisma").default;

async function main() {
  const publicProductsDir = path.join(process.cwd(), "public", "products");
  const outFile = path.join(process.cwd(), "public", "products-cache.json");

  const products = await prisma.product.findMany({ include: { brand: true } });
  const pageSize = 6;

  const pages = {};

  for (let i = 0; i < Math.ceil(products.length / pageSize); i++) {
    pages[i] = { products: [], images: [] };
  }

  for (const product of products) {
    const imagesDir = path.join(publicProductsDir, String(product.id));
    let productImagePaths = [];
    try {
      productImagePaths = await fs.readdir(imagesDir);
    } catch (err) {
      // no images for this product
      productImagePaths = [];
    }

    const blurDataURLs = await Promise.all(
      productImagePaths.map(async (fileName) => {
        const filePath = path.join(imagesDir, fileName);
        const buffer = await fs.readFile(filePath);
        const { base64 } = await getPlaiceholder(buffer);
        return base64;
      })
    ).catch(() => []);

    const prodSerialized = {
      ...product,
      createdAt: product.createdAt.toString(),
      updatedAt: product.updatedAt.toString(),
    };

    const imagesMeta = {
      id: product.id,
      images: {
        paths: productImagePaths.map((f) => `/products/${product.id}/${f}`),
        blurDataURLs,
      },
    };

    const pageIndex = Math.floor(products.findIndex((p) => p.id === product.id) / pageSize);
    if (!pages[pageIndex]) pages[pageIndex] = { products: [], images: [] };
    pages[pageIndex].products.push(prodSerialized);
    pages[pageIndex].images.push(imagesMeta);
  }

  const out = { generatedAt: new Date().toISOString(), pages };
  await fs.writeFile(outFile, JSON.stringify(out, null, 2), "utf8");
  console.log("Wrote precomputed products cache to", outFile);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
