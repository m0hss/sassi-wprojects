import Button, { Loading } from "../components/Button";
import { styled, Box } from "../stitches.config";
import { useCart } from "../lib/cart";
import { currencyCodeToSymbol } from "../lib/stripeHelpers";
import ProductCardCart from "../components/ProductCardCart";
import { cartItemToLineItem } from "../lib/stripeHelpers";
import Layout from "../components/Layout";
import PageHeadline from "../components/PageHeadline";
import Footer from "../components/Footer";
import { GetStaticProps, NextPage } from "next";
import { Tmeta } from "../types";
import MenuBar from "../components/MenuBar";
import { NextSeo } from "next-seo";
import { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";

export const getStaticProps: GetStaticProps = async () => {
  /**
   * Get shop meta data from env
   */

  const {
    headline = "قوالب و إضافات ووردبريس بنكهة عربية 😍 ", // "wordpress themes and plugins" in Arabic
    subheadline = "تصميم المواقع الخاصة بالشركات و المؤسسات و المواقع الشخصية والفنيه و التصميم و برمجة القوالب والاسكريبتات و برمجة قوالب خاصة على بلوجر والووردبريس. ",
    contact = "إتصل بنا",
  } = process.env;

  return {
    props: {
      meta: {
        headline,
        subheadline,
        contact,
      },
    },
  };
};

const ProductList = styled("div", {
  paddingBottom: "$4",
  display: "grid",
  gap: "$4",

  "@small": {
    gridTemplateColumns: "repeat(2, 1fr)",
  },

  "@medium": {
    gap: "$5",
  },

  "@large": {
    gap: "40px",
  },
});

const PaymentMethod = styled("label", {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "var(--colors-crimson1)",
  width: "calc(100% - 10px)",
});

const CartPage: NextPage<{ meta: Tmeta }> = ({ meta }) => {
  const { cart, productsTotal } = useCart();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [total, setTotal] = useState(productsTotal);
  const [paymentMethod, setPaymentMethod] = useState<
    "stripe" | "paypal" | "bancontact" | "Bitcoin"
  >("stripe");

  useEffect(() => {
    setTotal(productsTotal);
  }, [productsTotal]);

  const handleCheckout = async () => {
    setIsLoading(true);
    const lineItems = [...cart.values()].map((item) =>
      cartItemToLineItem({ cartItem: item, images: [""] }),
    );

    // Create a line item for shipping costs if they exist
    const response = await fetch("/api/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        line_items: lineItems,
        customer_email: email,
        payment_method: paymentMethod,
      }),
    });

    const session = await response.json();
    // Newer Stripe server-side Checkout returns a `url` that the client should
    // navigate to. stripe.redirectToCheckout was removed from Stripe.js.
    if (session && session.url) {
      // Redirect the browser to the Checkout page
      window.location.assign(session.url);
      return;
    }

    console.warn("No checkout URL returned from server", session);
    setIsLoading(false);
  };

  return (
    <>
  <NextSeo title={`${t("checkout.title")} - ${meta.headline}`} noindex={true} />
      <MenuBar />
  <PageHeadline>{t("checkout.title")}</PageHeadline>

      <>
        {cart.length ? (
          <>
            <Box
              as="p"
              css={{
                color: "$crimson11",
                fontSize: "16px",
                marginRight: "$1",
                marginLeft: "$1",
                fontWeight: 600,
              }}
            >
              {t("checkout.instructions")}
            </Box>
            <ProductList>
              {cart.map((item) => (
                <ProductCardCart
                  key={item.product.id}
                  item={item}
                  cart={cart}
                />
              ))}
            </ProductList>
            {/* Email is required for checkout */}
            <Box css={{ padding: "$3 0" }}>
              <Box
                as="label"
                css={{
                  display: "block",
                  marginBottom: "$2",
                  fontWeight: 600,
                  marginRight: "$1",
                  marginLeft: "$1",
                  color: "$crimson11",
                }}
              >
                {t("checkout.email_label")}
              </Box>
              <Box
                css={{
                  marginLeft: "-$2",
                  marginRight: "-$4",
                  paddingRight: "$4",
                  paddingLeft: "$4",
                  borderTop: "1px solid $mauve6",
                  borderBottom: "1px solid $mauve6",
                  borderLeft: "none",
                  borderRight: "none",
                }}
              >
                <Box
                  as="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("checkout.email_placeholder")}
                  required
                  css={{
                    width: "calc(100% - 22px)",
                    fontSize: "16px",
                    zIndex: 0,
                    paddingTop: "10px",
                    paddingBottom: "10px",
                    border: "none",
                    background: "$crimson1",
                    paddingRight: "$2",
                    transition:
                      "background 150ms, box-shadow 150ms, color 150ms",
                    "&::placeholder": {
                      fontFamily: "Cairo, sans-serif",
                      fontSize: "16px",
                    },
                      // Remove visible focus styles (keeps functionality but hides outline/box-shadow)
                      "&:focus": {
                        outline: "none",
                        boxShadow: "none",
                      },
                      // Also target focus-visible for browsers that support it
                      "&:focus-visible": {
                        outline: "none",
                        boxShadow: "none",
                      },
                  }}
                />
              </Box>

              {!email || !/\S+@\S+\.\S+/.test(email) ? (
                <Box
                  as="p"
                  css={{
                    color: "$crimson14",
                    marginTop: "$2",
                    marginRight: "$1",
                    marginLeft: "$1",
                    fontSize: "14px",
                  }}
                >
                  {t("checkout.email_invalid")}
                </Box>
              ) : null}
            </Box>
            <Box css={{ padding: "$3 0" }}>
                <Box
                as="label"
                css={{
                  display: "block",
                  marginBottom: "$2",
                  fontWeight: 600,
                  marginRight: "$1",
                  marginLeft: "$1",
                  color: "$crimson11",
                }}
              >
                {t("checkout.payment_method")}
              </Box>
              <Box
                css={{
                  marginLeft: "-$2",
                  marginRight: "-$4",
                  paddingRight: "$4",
                  paddingLeft: "$4",
                  borderTop: "1px solid $mauve6",
                  borderBottom: "1px solid $mauve6",
                  borderLeft: "none",
                  borderRight: "none",
                }}
              >
                <PaymentMethod>
                  <input
                    type="checkbox"
                    name="payment"
                    value="stripe"
                    checked={paymentMethod === "stripe"}
                    onChange={() => setPaymentMethod("stripe")}
                  />
                  {t("payment.card")}
                </PaymentMethod>
                <PaymentMethod>
                  <input
                    type="checkbox"
                    name="payment"
                    value="paypal"
                    checked={paymentMethod === "paypal"}
                    onChange={() => setPaymentMethod("paypal")}
                  />
                  {t("payment.paypal")}
                </PaymentMethod>
                <PaymentMethod>
                  <input
                    type="checkbox"
                    name="payment"
                    value="bancontact"
                    checked={paymentMethod === "bancontact"}
                    onChange={() => setPaymentMethod("bancontact")}
                  />
                  {t("payment.bancontact")}
                </PaymentMethod>
                <PaymentMethod>
                  <input
                    type="checkbox"
                    name="payment"
                    value="Bitcoin"
                    checked={paymentMethod === "Bitcoin"}
                    onChange={() => setPaymentMethod("Bitcoin")}
                  />
                  {t("payment.bitcoin")}
                </PaymentMethod>
              </Box>
            </Box>
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
                marginTop: "$5",
              }}
            >
              <div>
                <Box
                  css={{
                    color: "$crimson11",
                    marginRight: "$1",
                    marginLeft: "$1",
                  }}
                >
                  {t("checkout.total_label")}
                  {/* Get the currency code of the first item for now. */}
                </Box>
                <Box
                  css={{
                    fontFamily: "Work Sans, sans serif",
                    color: "$crimson12",
                    fontSize: "22px",
                    marginRight: "$1",
                    marginLeft: "$1",
                  }}
                >
                  {currencyCodeToSymbol(cart[0].product.currency)} {total / 100}
                </Box>
              </div>

              <Button
                disabled={
                  isLoading || !/\S+@\S+\.\S+/.test(email) || cart.length === 0
                }
                onClick={handleCheckout}
              >
                {isLoading ? <Loading /> : t("checkout.buy_now")}
              </Button>
            </Box>
          </>
        ) : (
          <div
            style={{
              marginRight: "5px",
              fontWeight: 600,
              margin: "10% auto",
              textAlign: "center",
            }}
          >
            {t("checkout.cart_empty")}
          </div>
        )}
      </>
      <Footer {...meta} />
    </>
  );
};

// @ts-ignore
CartPage.layout = Layout;

export default CartPage;
