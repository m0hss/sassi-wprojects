import { NextApiRequest, NextApiResponse } from "next";
import prisma from '../../../lib/prisma';
import { getPlaiceholder } from "plaiceholder";
import path from "path";
import getConfig from "next/config";

import { promises as fs } from "fs";

// Simple in-memory cache per cacheKey
const apiCache: Record<string, any> = {};
const cacheTimestamps: Record<string, number> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const page = (req.query.page as string) || "0";

    const cacheKey = `products:page:${page}`;

    // If a precomputed cache file exists under public, serve it (fast)
    const precomputedFile = path.join(process.cwd(), "public", "products-cache.json");
    try {
      const stat = await fs.stat(precomputedFile).catch(() => null);
      if (stat && stat.isFile()) {
        const raw = await fs.readFile(precomputedFile, "utf8");
        const json = JSON.parse(raw);
        // If the precomputed JSON contains pagination, try to return the requested page
        if (json && json.pages && json.pages[page]) {
          res.setHeader("x-cache", "PRECOMPUTED");
          res.setHeader("Cache-Control", "public, max-age=300");
          return res.status(200).json(json.pages[page]);
        }
      }
    } catch (err) {
      // ignore and fallback to runtime computation
    }

    const pageSize = 6;

    // Serve from in-memory cache if fresh
    if (
      apiCache[cacheKey] &&
      Date.now() - (cacheTimestamps[cacheKey] || 0) < CACHE_TTL
    ) {
      res.setHeader("x-cache", "HIT");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.status(200).json(apiCache[cacheKey]);
    }

  const results: any[] = await prisma.product.findMany({
      include: {
        brand: true,
      },
      skip: pageSize * parseInt(page),
      take: pageSize,
    });

    let allImagePaths = [];

    for (const product of results) {
      const imagesDirectory = path.join(
        process.cwd(),
        `public/products/${product.id}`
      );

      try {
        const productImagePaths = await fs.readdir(imagesDirectory);

        const blurDataURLs = await Promise.all(
          productImagePaths.map(async (src) => {
            const imagePath = path.join(imagesDirectory, src);
            const imageBuffer = await fs.readFile(imagePath);
            const { base64 } = await getPlaiceholder(imageBuffer);
            return base64;
          })
        );

        allImagePaths.push({
          id: product.id,
          images: {
            paths: productImagePaths.map((fileName) => `/products/${product.id}/${fileName}`),
            blurDataURLs: blurDataURLs,
          },
        });
      } catch (error) {
        console.warn(
          `Product ${product.name} has no images under /public/products/${product.id}!`
        );
      }
    }
    const payload = {
      products: results.map((product) => ({
        ...product,
        // Date objects needs to be converted to strings because the props object will be serialized as JSON
        createdAt: product.createdAt.toString(),
        updatedAt: product.updatedAt.toString(),
      })),
      images: await Promise.all(allImagePaths),
    };

    // Store in memory cache
    apiCache[cacheKey] = payload;
    cacheTimestamps[cacheKey] = Date.now();

    res.setHeader("x-cache", "MISS");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(payload);
  } else {
    // 501 Not Implemented
    res.status(501).end();
  }
}
