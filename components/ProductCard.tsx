"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { styled, Box } from "../stitches.config";
import type { Prisma } from "@prisma/client";
import { currencyCodeToSymbol } from "../lib/stripeHelpers";

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
});

const ImageContainer = styled("div", {
  position: "relative",
  height: "280px",
  width: "100%",
});

const AnimatedImage = styled(Image, {
  transition: ".3s",
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
  return (
    <Wrapper>
      <StyledLink href={`/products/${product.slug}`}>
        <ImageContainer>
          {images && images.images.mainPath ? (
            <AnimatedImage
              src={images.images.mainPath}
              fill={true}
              style={{ objectFit: "fill" }}
              alt={images.images.mainPath}
              placeholder={images.images.mainBlur ? "blur" : undefined}
              blurDataURL={images.images.mainBlur}
            />
          ) : images ? (
            <AnimatedImage
              src={images.images.paths[0]}
              fill={true}
              style={{ objectFit: "fill" }}
              alt={images.images.paths[0]}
              placeholder={images.images.blurDataURLs[0] ? "blur" : undefined}
              blurDataURL={images.images.blurDataURLs[0]}
            />
          ) : (
            <Image
              src={PlaceholderImage}
              fill={true}
              style={{ objectFit: "cover" }}
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
            <ProductBrand>{product.brand.name}</ProductBrand>
            <ProductName>{product.name}</ProductName>
          </div>
          <ProductPrice>
            {currencyCodeToSymbol(product.currency)} {product.price / 100}
          </ProductPrice>
        </Box>
      </StyledLink>
    </Wrapper>
  );
};

export default ProductCard;
