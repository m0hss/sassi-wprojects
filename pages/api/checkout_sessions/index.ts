import type { NextApiRequest, NextApiResponse } from "next";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

type ResponseData = {
  [key: string]: any;
};

const getPayPalBase = () =>
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error("Missing PayPal credentials");

  const tokenRes = await fetch(`${getPayPalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Failed to get PayPal token: ${tokenRes.status} ${text}`);
  }
  const json = await tokenRes.json();
  return json.access_token as string;
}

async function createPayPalOrder(line_items: any[], origin: string) {
  // Convert Stripe-like line_items (amounts in cents) to PayPal items (amounts in major currency units)
  if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
    throw new Error("No line items provided for PayPal order");
  }

  const currency = (line_items[0].price_data.currency || "USD").toUpperCase();
  const items = line_items.map((li) => {
    const unitCents = Number(
      li.price_data.unit_amount_decimal ?? li.price_data.unit_amount ?? 0,
    );
    const unitValue = (unitCents / 100).toFixed(2);
    return {
      name: li.price_data.product_data?.name ?? "Item",
      unit_amount: { currency_code: currency, value: unitValue },
      quantity: String(li.quantity ?? 1),
    };
  });

  const total = items.reduce(
    (acc, it) => acc + Number(it.unit_amount.value) * Number(it.quantity),
    0,
  );
  const totalStr = total.toFixed(2);

  const accessToken = await getPayPalAccessToken();

  const createRes = await fetch(`${getPayPalBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: totalStr,
            breakdown: {
              item_total: { currency_code: currency, value: totalStr },
            },
          },
          items,
        },
      ],
      application_context: {
        brand_name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Store",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        // PayPal rejects placeholders like {order_id} in return_url. Use a stable return URL
        // — PayPal will append a token query param (e.g. ?token=...) to the return URL after approval.
        // The client can then call your server to capture the order using that token.
        return_url: `${origin}/confirmation/?success=true&provider=paypal`,
        cancel_url: `${origin}/?canceled=true&provider=paypal`,
      },
    }),
  });

  if (!createRes.ok) {
    const txt = await createRes.text();
    throw new Error(`PayPal order creation failed: ${createRes.status} ${txt}`);
  }

  const json = await createRes.json();
  const approveLink = json.links?.find((l: any) => l.rel === "approve")?.href;
  return { order: json, approveLink };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method === "POST") {
    const { line_items, payment_method = "stripe", customer_email } = req.body;

    try {
      // ensure we have a reliable origin to build return URLs
      const defaultOrigin =
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const origin = (req.headers.origin as string) ?? defaultOrigin;

      if (payment_method === "paypal") {
        // Create PayPal order and return approval url
        const { approveLink, order } = await createPayPalOrder(
          line_items,
          origin,
        );
        res.status(200).json({ url: approveLink, order });
        return;
      }

      // Default: Stripe Checkout
      const session = await stripe.checkout.sessions.create({
        line_items,
        payment_method_types: ["card"],
        mode: "payment",
        // only require the billing address in Checkout
        billing_address_collection: "required",
        customer_email: customer_email,
        success_url: `${origin}/confirmation/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?canceled=true`,
      });

      res.status(200).json(session);
    } catch (err: any) {
      console.error("Something went wrong during checkout session creation.");
      console.error(err);
      res.status(500).json({ error: String(err?.message ?? err) });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
