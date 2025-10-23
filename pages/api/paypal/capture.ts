import type { NextApiRequest, NextApiResponse } from "next";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const { token } = req.body || {};
  if (!token)
    return res.status(400).json({ error: "Missing token in request body" });

  try {
    const accessToken = await getPayPalAccessToken();

    // 1) GET order details to check if it's already captured
    const orderRes = await fetch(`${getPayPalBase()}/v2/checkout/orders/${token}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const orderTxt = await orderRes.text();
    let orderJson: any;
    try {
      orderJson = JSON.parse(orderTxt);
    } catch (e) {
      orderJson = orderTxt;
    }

    if (!orderRes.ok) {
      return res.status(orderRes.status).json({ error: orderJson || orderTxt });
    }

    const captures = orderJson.purchase_units?.[0]?.payments?.captures ?? [];

    // Extract item names from the initial order GET (if available)
    const orderItems: string[] = (orderJson.purchase_units ?? [])
      .flatMap((pu: any) => (pu.items ?? []).map((it: any) => it?.name).filter(Boolean));

    // If there's a completed capture already, return it (idempotent)
    const completed = captures.find((c: any) => c.status === "COMPLETED");
    if (completed) {
      return res.status(200).json({ alreadyCaptured: true, capture: completed, order: orderJson, items: orderItems });
    }

    // 2) Not captured yet -> attempt capture
    const captureRes = await fetch(`${getPayPalBase()}/v2/checkout/orders/${token}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const txt = await captureRes.text();
    let json: any;
    try {
      json = JSON.parse(txt);
    } catch (e) {
      json = txt;
    }

    if (!captureRes.ok) {
      // If capture failed (race or duplicate), refresh order and try to return existing capture if present
      try {
        const recheck = await fetch(`${getPayPalBase()}/v2/checkout/orders/${token}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const recheckTxt = await recheck.text();
        const recheckJson = JSON.parse(recheckTxt);
        const reCaptures = recheckJson.purchase_units?.[0]?.payments?.captures ?? [];
        const found = reCaptures.find((c: any) => c.status === "COMPLETED");

        // Extract item names from the rechecked order
        const reItems: string[] = (recheckJson.purchase_units ?? [])
          .flatMap((pu: any) => (pu.items ?? []).map((it: any) => it?.name).filter(Boolean));

        if (found) {
          return res.status(200).json({ alreadyCaptured: true, capture: found, order: recheckJson, items: reItems });
        }
      } catch (e) {
        // swallow and fallthrough to return original error
      }

      return res.status(captureRes.status).json({ error: json || txt });
    }

    // On success, fetch the up-to-date order and include item names in the response
    try {
      const orderAfterRes = await fetch(`${getPayPalBase()}/v2/checkout/orders/${token}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const orderAfterTxt = await orderAfterRes.text();
      let orderAfterJson: any;
      try {
        orderAfterJson = JSON.parse(orderAfterTxt);
      } catch (e) {
        orderAfterJson = orderAfterTxt;
      }

      const orderItemsAfter: string[] = (orderAfterJson.purchase_units ?? [])
        .flatMap((pu: any) => (pu.items ?? []).map((it: any) => it?.name).filter(Boolean));

      let out: any;
      if (json && typeof json === "object" && !Array.isArray(json)) {
        out = { ...json, order: orderAfterJson, items: orderItemsAfter };
      } else {
        out = { result: json, order: orderAfterJson, items: orderItemsAfter };
      }

      return res.status(200).json(out);
    } catch (e) {
      // If fetching order fails, still return the capture result
      return res.status(200).json(json);
    }
  } catch (err: any) {
    console.error("PayPal capture failed", err);
    return res.status(500).json({ error: String(err?.message ?? err) });
  }
}
