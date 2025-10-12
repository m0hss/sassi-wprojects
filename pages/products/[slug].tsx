import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { promises as fs } from "fs";
import path from "path";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import Button from "../../components/Button";
import MenuBar from "../../components/MenuBar";
import { styled, Box } from "../../stitches.config";
import { useCart } from "../../lib/cart";
import { currencyCodeToSymbol } from "../../lib/stripeHelpers";
import PlaceholderImage from "../../public/placeholder.png";
import { Tmeta } from "../../types";
import Footer from "../../components/Footer";
import { NextSeo } from "next-seo";
import { getPlaiceholder } from "plaiceholder";
import { sanitizeHtml } from "../../lib/sanitize";
import { Cross1Icon } from "@radix-ui/react-icons";

// use shared prisma client from lib/prisma

export const getStaticPaths: GetStaticPaths = async () => {
  // Fetch product slugs (no availability filter)
  const products = await prisma.product.findMany({
    select: { slug: true },
  });

  return {
    paths: products.map((product) => ({
      params: {
        slug: product.slug,
      },
    })),
    fallback: false,
  };
};

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
   * Get the first product with
   * params.slug === product.slug
   */
  const product = await prisma.product.findFirst({
    where: {
      slug: {
        equals: params!.slug as string,
      },
    },
    include: {
      brand: true,
    },
  });

  /**
   * Get all images for this product that are place under /public/products/[id]
   */

  if (product) {
    const imagesDirectory = path.join(
      process.cwd(),
      `public/products/${product.id}`,
    );

    try {
      // Read files in the product image directory
      let productImagePaths = await fs.readdir(imagesDirectory);

      // Keep only common image file extensions
      productImagePaths = productImagePaths.filter((f) =>
        /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(f),
      );

      // If a manifest.json exists in the folder, prefer the ordering defined there.
      const manifestPath = path.join(imagesDirectory, "manifest.json");
      try {
        const manifestRaw = await fs.readFile(manifestPath, "utf8");
        const manifest = JSON.parse(manifestRaw) as {
          main?: unknown;
          demos?: unknown;
        };
        const mainFromManifest: string | undefined =
          typeof manifest.main === "string" ? manifest.main : undefined;
        const demosFromManifest: string[] | undefined = Array.isArray(
          manifest.demos,
        )
          ? manifest.demos.filter(
              (x: unknown): x is string => typeof x === "string",
            )
          : undefined;

        if (
          mainFromManifest ||
          (demosFromManifest && demosFromManifest.length)
        ) {
          const ordered: string[] = [];
          if (mainFromManifest && productImagePaths.includes(mainFromManifest))
            ordered.push(mainFromManifest);
          if (demosFromManifest) {
            for (const d of demosFromManifest)
              if (productImagePaths.includes(d) && !ordered.includes(d))
                ordered.push(d);
          }

          const remaining = productImagePaths.filter(
            (n) => !ordered.includes(n),
          );
          productImagePaths = [...ordered, ...remaining];
          console.log(
            `Using manifest for product ${product.id}: main=${mainFromManifest ? "yes" : "no"} demos=${demosFromManifest ? demosFromManifest.length : 0}`,
          );
        }
      } catch (err) {
        // manifest absent or invalid — fallback to directory ordering
      }

      /**
       * Create blurDataURLs (base64) as image placeholders
       */

      const blurDataURLs = await Promise.all(
        productImagePaths.map(async (src) => {
          // Read the local image file into a Buffer and pass it to plaiceholder
          const imagePath = path.join(imagesDirectory, src);
          const imageBuffer = await fs.readFile(imagePath);
          const { base64 } = await getPlaiceholder(imageBuffer);
          return base64;
        }),
      );

      // Sanitize description on the server to ensure SSR HTML matches client
      const sanitizedDescription = sanitizeHtml(product.description);

      return {
        props: {
          product: {
            ...product,
            description: sanitizedDescription,
            // Date objects needs to be converted to strings because the props object will be serialized as JSON
            createdAt: product?.createdAt.toString(),
            updatedAt: product?.updatedAt.toString(),
          },
          images: productImagePaths.map((path, index) => ({
            path: `/products/${product.id}/${path}`,
            blurDataURL: blurDataURLs[index],
          })),
          meta: {
            headline,
            subheadline,
            contact,
          },
        },
      };
    } catch (error) {
      console.warn(
        `Image ${product.name} has no images under /public/product/[id]!`,
      );
      console.error(error);
      const sanitizedDescription = sanitizeHtml(product.description);

      return {
        props: {
          product: {
            ...product,
            description: sanitizedDescription,
            // Date objects needs to be converted to strings because the props object will be serialized as JSON
            createdAt: product?.createdAt.toString(),
            updatedAt: product?.updatedAt.toString(),
          },
          images: [],
          meta: {
            headline,
            subheadline,
            contact,
          },
        },
      };
    }
  } else return { props: {} };
};

const ImageContainer = styled("div", {
  height: "64vh",
  position: "relative",
  marginLeft: "calc($4*-1)",
  marginRight: "calc($4*-1)",
  marginTop: "calc($4*-1)",

  transition: "1s",
});

const ProductName = styled("h1", {
  all: "unset",
  fontSize: "$4",
  lineHeight: "30px",
  color: "$crimson12",
  fontFamily: "Cairo, sans-serif",
});

const ProductPrice = styled("div", {
  fontSize: "$4",
  color: "$mauve12",
  fontFamily: "Cairo, sans-serif",
  display: "grid",
  placeContent: "center",
});

const ProductBrand = styled("div", {
  color: "$mauve8",
  paddingTop: "$4",
});

const ProductDescription = styled("div", {
  // color: "$crimson11",
  // fontSize: "16px",
  lineHeight: "2.5rem",
});

const DemoSection = styled("div", {
  marginTop: "$4",
  marginBottom: "$5",
  padding: "$3",
  borderRadius: 8,
  background: "$mauve2",
});

const DemoCaption = styled("h2", {
  color: "#b0436e",
  fontWeight: 800,
  fontFamily: "Cairo, sans-serif",
});

const AnimatedImage = styled(Image, {
  transition: "opacity .3s ease, filter .3s ease",
  transitionDelay: "120ms",
});

const LayoutWrapper = styled("div", {
  background: "$mauve1",
  padding: "$4",

  "@small": {
    padding: "10% 10%",
  },

  "@medium": {
    padding: "10% 15%",
  },

  "@large": {
    padding: "5% 30%",
  },
});

const ProductPage: NextPage<{
  product: Required<
    Prisma.ProductUncheckedCreateInput & {
      brand: Prisma.BrandUncheckedCreateInput;
    }
  >;
  images: { path: string; blurDataURL: string }[];
  meta: Tmeta;
}> = ({ product, images, meta }) => {
  const { cart, dispatch } = useCart();
  const [lightbox, setLightbox] = useState<{
    src: string;
    blur?: string;
  } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleAddToCart = () => {
    dispatch({
      type: "addItem",
      item: { product: product, images: [...images], count: 1 },
    });
  };

  // sanitize HTML description before rendering (reuse shared helper)
  const safeDescription = sanitizeHtml(product?.description || "");

  const isSpecialBrand = product?.brand?.id === 3;

  return (
    <LayoutWrapper>
      <NextSeo
        title={`${product.name} - ${meta.headline}`}
        openGraph={{
          type: "website",
          title: `${product.name} - ${meta.headline}`,
          site_name: meta.name,
        }}
      />
      <ImageContainer>
        {images.length ? (
          <div
            style={{ height: "100%", position: "relative"}}
          >
            <AnimatedImage
              src={images[0].path}
              layout="fill"
              // use cover so placeholder scales to the container size
              style={{ objectFit: "fill" }}
              alt={images[0].path}
              placeholder="blur"
              blurDataURL={images[0].blurDataURL}
            />
          </div>
        ) : (
          <div style={{ height: "100%", position: "relative" }}>
            <Image
              src={PlaceholderImage}
              layout="fill"
              objectFit="cover"
              alt="placeholder"
            />
          </div>
        )}
      </ImageContainer>
      <Box as="main" css={{ paddingBottom: "$3" }}>
        <ProductBrand>{product.brand.name}</ProductBrand>
        <Box css={{ display: "flex", alignItems: "center", gap: "$3", justifyContent: "space-between" }}>
          <ProductName>{product.name}</ProductName>
          {images.length ? (
            <Button
              onClick={() => {
                const previewUrl = (product as any).url as string | undefined;
                if (previewUrl) {
                  // open product preview URL in a new tab (simple behavior)
                  window.open(previewUrl, "_blank");
                } else {
                  setLightbox({ src: images[0].path, blur: images[0].blurDataURL });
                }
              }}
              aria-label="Preview product image"
            >
              معاينة
            </Button>
          ) : null}
        </Box>
        {/* <ProductDescription>{product.description}</ProductDescription> */}
        <ProductDescription
          dangerouslySetInnerHTML={{ __html: safeDescription }}
        />
        {/* Demo gallery: show up to 4 demo images (prefer images[1..4]) */}
        {!isSpecialBrand ? (
          <>
            <DemoCaption>صور {product.name}</DemoCaption>
            <DemoSection>
        
          <Box
            css={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "$3",
            }}
          >
            {(() => {
              // build an array of up to 4 images: prefer images[1..], else use images[0], else placeholder
              const demoCandidates: { path: string; blurDataURL?: string }[] =
                [];
              if (images.length > 1) {
                // take images[1..4] (or fewer if not available)
                for (let i = 1; i <= 6 && i < images.length; i++)
                  demoCandidates.push(images[i]);
              }
              // if no images beyond the main, but we have at least one, duplicate the main as fallback
              if (demoCandidates.length === 0 && images.length > 0)
                demoCandidates.push(images[0]);

              // ensure we have up to 4 slots; if still empty push a placeholder marker
              while (
                demoCandidates.length < 6 &&
                demoCandidates.length < (images.length > 0 ? images.length : 1)
              ) {
                // noop - avoid infinite loop; this while only ensures we don't exceed 4
                break;
              }

              // render up to 4 tiles; if demoCandidates is empty show single placeholder tile
              if (demoCandidates.length === 0) {
                return (
                  <Image
                    src={PlaceholderImage}
                    layout="responsive"
                    width={400}
                    height={300}
                    objectFit="cover"
                    alt="placeholder"
                  />
                );
              }

              return demoCandidates
                .slice(0, 6)
                .map((img, idx) => (
                  <AnimatedImage
                    key={idx}
                    src={img.path}
                    layout="responsive"
                    width={400}
                    height={300}
                    objectFit="cover"
                    alt={`${product.name} demo ${idx + 1}`}
                    placeholder={img.blurDataURL ? "blur" : undefined}
                    blurDataURL={img.blurDataURL}
                    css={{ cursor: "pointer", borderRadius: 6 }}
                    onClick={() =>
                      setLightbox({ src: img.path, blur: img.blurDataURL })
                    }
                  />
                ));
            })()}
          </Box>
            </DemoSection>
          </>
        ) : null}
        {/* Lightbox overlay */}
        {lightbox ? (
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setLightbox(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                maxWidth: 1600,
                maxHeight: 1000,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatedImage
                src={lightbox.src}
                layout="fill"
                objectFit="contain"
                alt="preview"
                placeholder={lightbox.blur ? "blur" : undefined}
                blurDataURL={lightbox.blur}
              />
              <button
                aria-label="Close"
                onClick={() => setLightbox(null)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: 10,
                  background: "mauve12",
                  color: "crimson1",
                  border: "none",
                  padding: 8,
                  borderRadius: 6,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Cross1Icon width={14} height={14} />
              </button>
            </div>
          </div>
        ) : null}
        {!isSpecialBrand ? (
          <Box
            css={{
              display: "flex",
              justifyContent: "space-between",
              paddingLeft: "$4",
              marginLeft: "-$4",
              paddingRight: "$4",
              marginRight: "-$4",
              borderBottom: "1px solid $mauve4",
              borderTop: "1px solid $mauve4",
            }}
          >
            <ProductPrice>
              {currencyCodeToSymbol(product.currency)} {product.price / 100}
            </ProductPrice>
            <Button onClick={handleAddToCart}>أضف إلى سلة التسوق</Button>
          </Box>
        ) : null}
      </Box>
      <MenuBar />
      <Footer {...meta} />
    </LayoutWrapper>
  );
};

export default ProductPage;
