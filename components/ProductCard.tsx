"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { styled, Box } from "../stitches.config";
import type { Prisma } from "@prisma/client";
import { currencyCodeToSymbol } from "../lib/stripeHelpers";
import { useI18n } from "../lib/i18n";

import PlaceholderImage from "../public/placeholder.png";

const Wrapper = styled("div", {
  display: "flex",
  background: "$crimson1",
  cursor: "pointer",

  a: {
    flex: 1,
  },
});

const ProductName = styled("div", {
  fontFamily: "Changa, sans serif",
  color: "$crimson12",
  fontSize: "16px",
  marginRight: "$1",
  marginLeft: "$1",
});

const ProductPrice = styled("div", {
  display: "grid",
  placeContent: "center",
  marginLeft: "$1",
  minWidth: "20%",
});

const ProductBrand = styled("div", {
  color: "$crimson11",
  fontSize: "12px",
  marginRight: "$1",
  marginLeft: "$1",
});

const ImageContainer = styled("div", {
  position: "relative",
  height: "280px",
  width: "100%",
});

const AnimatedImage = styled(Image, {
  // Use filter-only transition so Next.js' blur placeholder smoothly becomes sharp.
  transition: "filter 300ms ease",
  transitionDelay: "200ms",
});

// Style the Link component directly since it's now an <a> tag internally
const StyledLink = styled(Link, {
  flex: 1,
  textDecoration: "none",
  color: "inherit",
  display: "block",
});

const ProductCard: React.FunctionComponent<{
  product: Required<
    Prisma.ProductUncheckedCreateInput & {
      brand: Prisma.BrandUncheckedCreateInput;
    }
  >;
  images?: {
    id: number;
    images: {
      paths: string[];
      blurDataURLs: string[];
      mainPath?: string;
      mainBlur?: string;
    };
  };
}> = ({ product, images }) => {
  const { locale } = useI18n();

  // DB fields: `name` holds Arabic; `name_en` holds English. Compute localized
  // values on the client in an effect so they reliably update after hydration
  // when the locale changes (avoids any subtle timing/hydration issues).
  // Extract stable values so hooks can declare simple deps
  const productNameEn = (product as any).name_en as string | undefined;
  const productName = product.name as string;
  const brandNameEn = (product.brand as any)?.name_en as string | undefined;
  const brandName = (product.brand as any)?.name as string;

  const [localizedName, setLocalizedName] = useState<string>(productNameEn || productName);
  const [localizedBrandName, setLocalizedBrandName] = useState<string>(brandNameEn || brandName);

  useEffect(() => {
    const name = locale === "en" ? productNameEn || productName : productName;
    setLocalizedName(name);

    const bName = locale === "en" ? brandNameEn || brandName : brandName;
    setLocalizedBrandName(bName);
  }, [locale, productNameEn, productName, brandNameEn, brandName]);

  // determine brand id (try nested brand.id first, then product.brandId)
  const brandId = (product.brand as any)?.id ?? (product as any).brandId ?? null;

  return (
    <Wrapper>
      <StyledLink href={`/products/${product.slug}`}>
        <ImageContainer>
          {images && images.images.mainPath ? (
            <AnimatedImage
              src={images.images.mainPath}
              fill={true}
              // use cover so placeholder scales to the card container
              style={{ objectFit: "fill" }}
              alt={images.images.mainPath}
              // responsive size: full width on small screens, ~1/3 viewport on larger
              sizes="(max-width: 640px) 100vw, 33vw"
              placeholder={images.images.mainBlur ? "blur" : undefined}
              blurDataURL={images.images.mainBlur}
            />
          ) : images ? (
            <AnimatedImage
              src={images.images.paths[0]}
              fill={true}
              // use cover so placeholder scales to the card container
              style={{ objectFit: "cover" }}
              alt={images.images.paths[0]}
              // responsive size: full width on small screens, ~1/3 viewport on larger
              sizes="(max-width: 640px) 100vw, 33vw"
              placeholder={images.images.blurDataURLs[0] ? "blur" : undefined}
              blurDataURL={images.images.blurDataURLs[0]}
            />
          ) : (
            <Image
              src={PlaceholderImage}
              fill={true}
              style={{ objectFit: "cover" }}
              // placeholder used in product list - same responsive sizing
              sizes="(max-width: 640px) 100vw, 33vw"
              alt="placeholder"
            />
          )}
        </ImageContainer>
        <Box
          css={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: "$1",
            paddingBottom: "$1",
            paddingLeft: "$4",
            marginLeft: "-$4",
            paddingRight: "$4",
            marginRight: "-$4",
            borderBottom: "1px solid $mauve4",
            borderTop: "1px solid $mauve4",
          }}
        >
          <div>
            <ProductBrand>{localizedBrandName}</ProductBrand>
            <ProductName>{localizedName}</ProductName>
          </div>
          {brandId !== 3 && (
            <ProductPrice>
              {currencyCodeToSymbol(product.currency)} {product.price / 100}
            </ProductPrice>
          )}
        </Box>
      </StyledLink>
    </Wrapper>
  );
};

export default ProductCard;
