import { GetStaticProps } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import Layout from "../components/Layout";
import { styled, Box } from "../stitches.config";
import ProductCard from "../components/ProductCard";
import MenuBar from "../components/MenuBar";
import Button from "../components/Button";
import { promises as fs } from "fs";
import path from "path";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import PageHeadline from "../components/PageHeadline";
import type { Tmeta } from "../types";
import Footer from "../components/Footer";
import { NextSeo } from "next-seo";
import { getPlaiceholder } from "plaiceholder";
import { useI18n } from "../lib/i18n";

// use shared prisma client from lib/prisma

export const getStaticProps: GetStaticProps = async ({ params }) => {
  /**
   * Get shop meta data from env
   */

  const {
    headline = "قوالب و إضافات ووردبريس بنكهة عربية 😍 ", // "wordpress themes and plugins" in Arabic
    subheadline = "تصميم المواقع الخاصة بالشركات و المؤسسات و المواقع الشخصية والفنيه و التصميم و برمجة القوالب والاسكريبتات و برمجة قوالب خاصة على بلوجر والووردبريس.",
    contact = "إتصل بنا",
  } = process.env;

  // Fetch products (no availability filter) and limit to 6 for the homepage
  const products = await prisma.product.findMany({
    include: {
      brand: true,
    },
    take: 7,
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

          // Filter to image files only
          const imageFiles = productImagePaths.filter((f) => /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(f));

          const blurDataURLs = await Promise.all(
            imageFiles.map(async (src) => {
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
              paths: imageFiles.map((imagePath) => `/products/${product.id}/${imagePath}`),
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
      },
    };
  } else return { props: {} };
};

const Grid = styled("div", {
  display: "grid",
  gap: "$4",

  "@small": {
    gridTemplateColumns: "repeat(2, 1fr)",
  },

  "@medium": {
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "$5",
  },

  "@large": {
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "35px",
  },
});

const Home: React.FunctionComponent<{
  products: Required<
    Prisma.ProductUncheckedCreateInput & {
      brand: Prisma.BrandUncheckedCreateInput;
    }
  >[];
  images: {
    id: number;
    images: { paths: string[]; blurDataURLs: string[]; mainPath?: string; mainBlur?: string };
  }[];
  meta: Tmeta;
}> = ({ products, images, meta }) => {
  const { t } = useI18n();

  // prefer translation keys but fall back to meta/env-provided strings
  const headlineText = t("headline", meta?.headline ?? "") || meta?.headline;
  const subheadlineText = t("subheadline", meta?.subheadline ?? "") || meta?.subheadline;
  const contactText = t("contact", meta?.contact ?? "") || meta?.contact;

  return (
    <>
      <NextSeo
        title={headlineText}
        description={subheadlineText}
        openGraph={{
          type: "website",
          title: headlineText,
          description: subheadlineText,
          site_name: meta.name,
        }}
      />
      <MenuBar />
      <PageHeadline>{headlineText}</PageHeadline>
      <Box
        as="p"
        css={{
          color: "$crimson11",
          fontSize: "16px",
          paddingBottom: "$4",
          margin: 0,
          paddingRight: "$2",
          paddingLeft: "$2",
        }}
      >
        {subheadlineText}
      </Box>
      <Grid>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            images={images.filter((image) => image.id === product.id)[0]}
          />
        ))}
      </Grid>
      <Button
        as={Link}
        href="/products"
        css={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          margin: "$4 0",
          gap: "$2",
          direction: "ltr",
        }}
      >
            <span>{t("products.view_all")}</span>
        <ArrowRightIcon />
      </Button>
      <Footer {...meta} contact={contactText} />
    </>
  );
};

// @ts-ignore
Home.layout = Layout;

export default Home;
