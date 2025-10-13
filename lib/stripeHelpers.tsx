// import { Prisma } from "@prisma/client";
import type { CartItem } from "./cart";
import { sanitizeHtml } from "./sanitize";

export const cartItemToLineItem = ({
  cartItem,
  images,
}: {
  cartItem: CartItem;
  images: string[];
}) => {
  return {
    price_data: {
      currency: cartItem.product.currency, //ISO Code https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/amendments/lists/list_one.xml
      unit_amount_decimal: cartItem.product.price,
      product_data: {
        name: cartItem.product.name,
        // Sanitize and strip HTML to provide plain text to Stripe (avoid raw HTML in Checkout)
        description: (() => {
          const raw = cartItem.product.description ?? "";
          const cleaned = sanitizeHtml(raw);
          const textOnly = cleaned.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
          // Cap description length to 500 chars to avoid overly long fields
          return textOnly.length > 500 ? textOnly.substr(0, 500) : textOnly;
        })(),
        images: ["urlToImage"],
        // meta: { key: "value" },
        // tax_code: "dqwd", // https://stripe.com/docs/tax/tax-codes
      },
    },
    adjustable_quantity: {
      enabled: true,
    },
    // dynamic_tax_rates
    quantity: cartItem.count,
  };
};

/**
 * This is a singleton to ensure we only instantiate Stripe once.
 * Use @stripe/stripe-js/pure to delay loading of Stripe.js until Checkout.
 */
import { loadStripe } from "@stripe/stripe-js/pure";
import type { Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

const currencies = new Map([
  ["usd", "$"],
  ["eur", "€"],
]);

export const currencyCodeToSymbol = (currencyCode: string) => {
  return currencies.get(currencyCode);
};
