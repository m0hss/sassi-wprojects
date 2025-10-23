import { GetStaticProps } from "next";
import { promises as fs } from "fs";
import React, { useState } from "react";
import path from "path";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import Layout from "../../components/Layout";
import { styled, Box } from "../../stitches.config";
import ProductCard from "../../components/ProductCard";
import PageHeadline from "../../components/PageHeadline";
import { Tmeta } from "../../types";
import Footer from "../../components/Footer";
import MenuBar from "../../components/MenuBar";
import { useI18n } from "../../lib/i18n";
import { NextSeo } from "next-seo";
import { getPlaiceholder } from "plaiceholder";
import Button from "../../components/Button";
import useSWR, { SWRConfig } from "swr";
import { ArrowRightIcon, ArrowLeftIcon } from "@radix-ui/react-icons";

// use shared prisma client from lib/prisma

export const getStaticProps: GetStaticProps = async ({ params }) => {
  /**
   * Get shop meta data from env
   */

  const {
    headline = "قوالب و إضافات ووردبريس بنكهة عربية 😍 ", // "wordpress themes and plugins" in Arabic
    subheadline = "تصميم المواقع الخاصة بالشركات و المؤسسات و المواقع الشخصية والفنيه و التصميم و برمجة القوالب والاسكريبتات و برمجة قوالب خاصة على بلوجر والووردبريس. ",
    contact = "إتصل بنا",
  } = process.env;

  /**
   * Count the number of products to make pagination work
   */
  const {
    _count: { id: count },
  } = await prisma.product.aggregate({
    _count: {
      id: true,
    },
  });

  /**
   * Get all products with
   * availability !== notVisible
   */
  // Fetch products (no availability filter) and limit to 6 for the page
  const products = await prisma.product.findMany({
    include: {
      brand: true,
    },
    take: 6,
  });

  /**
   * Get all images forthose products that are place under /public/products/[id]
   */

  if (products && products.length > 0) {
    let allImagePaths = [];

    for (const product of products) {
      const imagesDirectory = path.join(
        process.cwd(),
        `public/products/${product.id}`,
      );

      try {
        const productImagePaths = await fs.readdir(imagesDirectory);

        // Filter to image files only (same pattern used elsewhere)
        const imageFiles = productImagePaths.filter((f) => /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(f));

        const blurDataURLs = await Promise.all(
          imageFiles.map(async (src) => {
            // Read the local image file into a Buffer and pass it to plaiceholder
            const imagePath = path.join(imagesDirectory, src);
            const imageBuffer = await fs.readFile(imagePath);
            const { base64 } = await getPlaiceholder(imageBuffer);
            return base64;
          }),
        );

        // try to read manifest.json and resolve main if present
        let mainPath: string | null = null;
        let mainBlur: string | undefined = undefined;
        try {
          const manifestRaw = await fs.readFile(path.join(imagesDirectory, "manifest.json"), "utf8");
          const manifest = JSON.parse(manifestRaw) as { main?: string; demos?: string[] };
          if (manifest && typeof manifest.main === "string") {
            const candidate = manifest.main;
            const idx = imageFiles.findIndex((n) => n === candidate);
            if (idx >= 0) {
              mainPath = `/products/${product.id}/${imageFiles[idx]}`;
              mainBlur = blurDataURLs[idx];
            }
          }
        } catch (err) {
          // no manifest or invalid -> leave mainPath null
        }

        allImagePaths.push({
          id: product.id,
          images: {
            paths: imageFiles.map(
              (fileName) => `/products/${product.id}/${fileName}`,
            ),
            blurDataURLs: blurDataURLs,
            // include resolved main if manifest provided one
            mainPath,
            mainBlur,
          },
        });
      } catch (error) {
        console.warn(
          `Product ${product.name} has no images under /public/products/${product.id}!`,
        );
      }
    }

    return {
      props: {
        products: products.map((product) => ({
          ...product,
          // Date objects needs to be converted to strings because the props object will be serialized as JSON
          createdAt: product.createdAt.toString(),
          updatedAt: product.updatedAt.toString(),
        })),
        images: await Promise.all(allImagePaths),
        meta: {
          headline,
          subheadline,
          contact,
        },
        productsCount: count,
      },
    };
  } else return { props: {} };
};

const Grid = styled("main", {
  paddingBottom: "$4",
  display: "grid",
  gap: "$4",

  "@small": {
    gridTemplateColumns: "repeat(2, 1fr)",
  },

  "@medium": {
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "$5",
  },

  "@large": {
    gap: "40px",
  },
});

const ProductsGrid: React.FunctionComponent<{ page: number }> = ({ page }) => {
  const { data, error } = useSWR<{
    products: Required<
      Prisma.ProductUncheckedCreateInput & {
        brand: Prisma.BrandUncheckedCreateInput;
      }
    >[];
    images: {
      id: number;
      images: { paths: string[]; blurDataURLs: string[] };
    }[];
  }>(`/api/products?page=${page}`, (url: string) =>
    fetch(url).then((res) => res.json()),
  );

  return (
    <Grid>
      {data?.products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          images={data.images.filter((image) => image.id === product.id)[0]}
        />
      ))}
    </Grid>
  );
};

const Products: React.FunctionComponent<{
  products: Required<
    Prisma.ProductUncheckedCreateInput & {
      brand: Prisma.BrandUncheckedCreateInput;
    }
  >[];
  images: { id: number; images: { paths: string[]; blurDataURLs: string[] } }[];
  meta: Tmeta;
  productsCount: number;
}> = ({ products, images, meta, productsCount }) => {
  const [page, setPage] = useState(0);
  const { t } = useI18n();
  const contactText = t("contact", meta?.contact ?? "إتصل بنا");

  return (
    <>
      <NextSeo
        title={meta.headline}
        description={meta.subheadline}
        openGraph={{
          type: "website",
          title: meta.headline,
          description: meta.subheadline,
          site_name: meta.name,
        }}
      />
  <MenuBar />
  <PageHeadline>{t("products.headline", meta?.headline ?? "قوالب و إضافات")}</PageHeadline>
      <SWRConfig
        value={{ fallback: { "/api/products?page=0": { products, images } } }}
      >
        <ProductsGrid page={page} />
      </SWRConfig>
      <Box
        css={{
          display: "flex",
          justifyContent: "space-between",
          direction: "ltr",
        }}
      >
        {page ? (
          <Button
            css={{
              justifySelf: "flex-end",
              direction: "rtl",
              alignItems: "center",
              display: "flex",
              gap: "$2",
              padding: "18px 20px",
            }}
            onClick={() => setPage(page - 1)}
          >
            <span>{t("pagination.prev", "السابق")}</span>
            <ArrowLeftIcon />
          </Button>
        ) : (
          <Box css={{ flex: 1 }} />
        )}
        {(page + 1) * 6 >= productsCount ? (
          <Box css={{ flex: 1 }} />
        ) : (
          <Button
            css={{
              justifySelf: "flex-end",
              direction: "ltr",
              alignItems: "center",
              display: "flex",
              gap: "$2",
              padding: "18px 20px",
            }}
            onClick={() => setPage(page + 1)}
          >
            <span>{t("pagination.next", "التالي")}</span>
            <ArrowRightIcon />
          </Button>
        )}
      </Box>
  <Footer {...meta} contact={contactText} />
    </>
  );
};

// @ts-ignore
Products.layout = Layout;

export default Products;
