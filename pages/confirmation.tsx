import { styled, Box } from "../stitches.config";
import useSWR from "swr";
import { useRouter } from "next/router";
import { fetchGetJSON } from "../lib/fetcher";
import { useEffect, useState, useRef } from "react";
import { NextSeo } from "next-seo";
import { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import MenuBar from "../components/MenuBar";
import { useCart } from "../lib/cart";
import { Tmeta } from "../types";
import Footer from "../components/Footer";
import SuccessImage from "../public/jason-dent-WNVGLwGMCAg-unsplash.jpg";
import PageHeadline from "../components/PageHeadline";

const ImageContainer = styled("div", {
  height: "64vh",
  position: "relative",
  marginLeft: "calc($4*-1)",
  marginRight: "calc($4*-1)",
  marginTop: "calc($4*-1)",

  transition: "1s",
});

const ProductDescription = styled("p", {
  // color: "$crimson11",
  fontSize: "16px",
  lineHeight: "24px",
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
    padding: "5% 25%",
  },
});

const Subheadline = styled("h1", {
  fontFamily: "Roboto, sans serif",
  fontSize: "16px",
  fontWeight: "normal",
  // color: "$crimson11",
});

export const getStaticProps: GetStaticProps = async ({ params }) => {
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

const Confirmation: NextPage<{ meta: Tmeta }> = ({ meta }) => {
  const { dispatch } = useCart();
  const router = useRouter();

  const { data: stripeData, error: stripeError } = useSWR(
    router.query.session_id
      ? `/api/checkout_sessions/${router.query.session_id}`
      : null,
    fetchGetJSON,
  );

  const [paypalData, setPaypalData] = useState<any | null>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const capturedRef = useRef(false);

  useEffect(() => {
    // If the return from PayPal includes a `token` query param, capture the order.
    const token = router.query.token as string | undefined;
    if (!token) return;

    // Ensure router is ready and we haven't already attempted capture
    if (!router.isReady) return;
    if (capturedRef.current) return;
    capturedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/paypal/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          const txt = await res.text();
          setPaypalError(txt || `Capture failed with status ${res.status}`);
          return;
        }

        const json = await res.json();
        setPaypalData(json);
      } catch (err: any) {
        setPaypalError(String(err?.message ?? err));
      }
    })();
  }, [router.query.token, router.isReady]);

  useEffect(() => {
    // If checkout is completed, the cart should be cleared.
    dispatch({ type: "clearCart" });
  }, []);

  /**
   * Data for buyer
   * data.payment_intent.charges.data[0].billing_details.email
   * data.payment_intent.charges.data[0].billing_details.name
   *
   */

  /**
   * Data for seller
   * data.payment_intent
   */

  return (
    <LayoutWrapper>
      <NextSeo noindex={true} />
      <ImageContainer>
        <Image
          src={SuccessImage}
          fill={true}
          style={{ objectFit: "cover" }}
          // full-bleed success image
          sizes="100vw"
          alt="success image"
          placeholder="blur"
        />
      </ImageContainer>
      <Box as="main" css={{ paddingBottom: "$3" }}>
        <Box css={{ textAlign: "center" }}>
          <PageHeadline>
            {(stripeError || paypalError) && (
              <span>تعذّر التحقق من دفعتك.</span>
            )}
            {(stripeData || paypalData) && <span>شكرا! تم الدفع بنجاح.</span>}
          </PageHeadline>
        </Box>

        {/* Stripe success */}
        {stripeData && (
          <Subheadline>
            مرجع طلبك: (الرجاء الاحتفاظ به لأي استفسار أو مشكل)
            <br />
            <strong>{stripeData.payment_intent.id}</strong>
          </Subheadline>
        )}

        {/* PayPal success */}
        {paypalData && (
          <div>
            {/* Products list: show all products and quantities in format `name x quantity`. */}
            {(() => {
              if (!paypalData) return null;

              const lines: string[] = [];
              const orderObj = paypalData.order ?? paypalData;
              const pus =
                orderObj?.purchase_units ?? paypalData.purchase_units ?? [];

              pus.forEach((pu: any) => {
                (pu.items ?? []).forEach((it: any) => {
                  const name = it?.name;
                  const qty =
                    it?.quantity ??
                    (it?.quantity?.toString ? it.quantity.toString() : "1");
                  if (name) lines.push(`${name} x ${qty}`);
                });
              });

              // fallback to simple server-provided names (no quantity info) -> assume qty 1
              if (lines.length === 0 && Array.isArray(paypalData.items)) {
                paypalData.items.forEach((n: string) => {
                  if (n) lines.push(`${n} x 1`);
                });
              }

              if (lines.length === 0) return null;

              return (
                <ProductDescription>
                  المنتجات:
                  <br />
                  {lines.map((line, idx) => (
                    <span key={`pp-item-${idx}`}>
                      <strong>{line}</strong>
                      {idx < lines.length - 1 ? (
                        <>
                          <br />
                        </>
                      ) : null}
                    </span>
                  ))}
                </ProductDescription>
              );
            })()}

            {/* Show payer info if available */}
            {paypalData.payer && (
              <ProductDescription>
                اسم المشتري:{" "}
                <strong>
                  {paypalData.payer.name?.given_name}{" "}
                  {paypalData.payer.name?.surname}
                </strong>
                <br />
                البريد الإلكتروني:{" "}
                <strong>{paypalData.payer.email_address}</strong>
                <br />
                مرجع طلبك:{" "}
                <strong>
                  {paypalData.id ||
                    paypalData.purchase_units?.[0]?.payments?.captures?.[0]?.id}
                </strong>
              </ProductDescription>
            )}
          </div>
        )}
      </Box>
      <MenuBar />
      <Footer {...meta} />
    </LayoutWrapper>
  );
};

// @ts-ignore
// Confirmation.layout = Layout;

export default Confirmation;
