"use client";

import Link from "next/link";
import Image from "next/image";
import { styled, Box } from "../stitches.config";
// import { Prisma } from "@prisma/client";
import { useCart } from "../lib/cart";
import { currencyCodeToSymbol } from "../lib/stripeHelpers";
import PlaceholderImage from "../public/placeholder.png";

import type { CartItem } from "../lib/cart";
import { sanitizeHtml } from "../lib/sanitize";
import { useEffect, useState, useCallback } from "react";

const Wrapper = styled("div", {
  boxShadow:
    "0px 4px 8px rgba(0, 0, 0, 0.04), 0px 0px 2px rgba(0, 0, 0, 0.06), 0px 0px 1px rgba(0, 0, 0, 0.04)",
  borderRadius: "1px",
  display: "flex",
  background: "$crimson1",
});

const ProductName = styled("strong", {
  all: "unset",
  fontSize: "18px",
  lineHeight: "18px",
  color: "$crimson12",
  fontFamily: "Cairo, sans-serif",
});

const ProductPrice = styled("div", {
  fontSize: "20px",
  lineHeight: "20px",
  color: "$crimson12",
  fontFamily: "Work Sans, sans-serif",
});

const ProductDescription = styled("p", {
  color: "$mauve10",
  fontSize: "12px",
  padding: 0,
  margin: 0,
});

const CountButton = styled("button", {
  all: "unset",
  width: 30,
  height: 30,
  background: "$mauve3",
  color: "$mauve10",
  borderRadius: "$small",
  display: "inline-grid",
  placeContent: "center",
  cursor: "pointer",

  "&:hover": {
    background: "$mauve4",
  },

  "&:focus": {
    boxShadow: "0px 0px 2px 0px $mauve10",
  },
});

const ImageContainer = styled("div", {
  display: "block",
  position: "relative",
  height: "130px",
  width: "110px",
  cursor: "pointer",
});

// Styled Link wrapper to avoid having an <a> descendant inside another <a>
const StyledLink = styled(Link, {
  all: "unset",
  display: "block",
});

const ProductCardCart: React.FunctionComponent<{
  item: CartItem;
  cart: CartItem[];
}> = ({ item }) => {
  const { cart, dispatch } = useCart();
  const { product, images } = item;

  // no debug logs

  const count = cart.find((p) => p.product.id === item.product.id)?.count ?? 0;

  const handleAddItem = () => {
    dispatch({
      type: "addItem",
      item: { product: product, images: [...(images ?? [])], count: 1 },
    });
  };

  const handleRemoveItem = () => {
    dispatch({
      type: "removeItem",
      item: { product: product, images: [...(images ?? [])], count: 1 },
    });
  };
  return (
    <Wrapper>
      <Box css={{ display: "flex", flex: 1 }}>
        <StyledLink href={`/products/${product.slug}`}>
          <ImageContainer>
            {images?.length ? (
              images[0].blurDataURL ? (
                <Image
                  src={images[0].path}
                  fill={true}
                  style={{ objectFit: "cover" }}
                  alt={images[0].path}
                  // cart thumbnail: container is ~110px wide, hint the browser
                  sizes="110px"
                  placeholder="blur"
                  blurDataURL={images[0].blurDataURL}
                />
              ) : (
                <Image
                  src={images[0].path}
                  fill={true}
                  style={{ objectFit: "cover" }}
                  alt={images[0].path}
                  // cart thumbnail: fixed size hint
                  sizes="110px"
                />
              )
            ) : (
              <Image
                src={PlaceholderImage}
                fill={true}
                style={{ objectFit: "cover" }}
                // placeholder thumbnail
                sizes="110px"
                alt="placeholder"
              />
            )}
          </ImageContainer>
        </StyledLink>
        <Box css={{ padding: "$3", display: "flex", flex: 1, justifyContent: "space-between" }}>
          <Box
            css={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              marginRight: "$2",
            }}
          >
            <ProductName>{product.name}</ProductName>
            <ProductDescription>
              {
                // sanitize the description and strip any tags for a safe preview
                ((): string => {
                  const raw = product.description ?? "";
                  const cleaned = sanitizeHtml(raw);
                  const textOnly = cleaned.replace(/<[^>]+>/g, "");
                  return textOnly.length > 40 ? textOnly.substr(0, 40) + "..." : textOnly;
                })()
              }
            </ProductDescription>
            <ProductPrice>
              {currencyCodeToSymbol(product.currency)} {product.price / 100}
            </ProductPrice>
          </Box>
          <Box
            css={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              marginRight: "$2",
            }}
          >
            <CountButton
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAddItem();
              }}
            >
              +
            </CountButton>
            <Box css={{ textAlign: "center" }} data-testid="productCount">
              {count}
            </Box>
            <CountButton
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveItem();
              }}
            >
              -
            </CountButton>
          </Box>
        </Box>
      </Box>
    </Wrapper>
  );
};

export default ProductCardCart;
