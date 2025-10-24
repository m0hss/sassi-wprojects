import { Resend } from "resend";

/**
 * Helper to read the Resend API key from env. Will throw if missing so callers fail fast.
 */
export function getResendApiKey(): string {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY environment variable is not set. Set RESEND_API_KEY in your environment.",
    );
  }
  return key;
}

let _resend: Resend | null = null;

/**
 * Returns a singleton Resend client configured from env.
 */
export function getResendClient(): Resend {
  if (_resend) return _resend;
  // Use named import; keep runtime creation here so importing this file on client-side won't attempt to create with missing env.
  _resend = new Resend(getResendApiKey());
  return _resend;
}

/**
 * Small helper to send a contact email via Resend.
 * Accepts simple payload and returns the resend API response.
 */
export async function sendContactEmail(opts: {
  from?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}) {
  const resend = getResendClient();
  const from =
    opts.from ||
    process.env.SHOP_CONTACT ||
    `no-reply@${process.env.VERCEL_URL ?? "example.com"}`;

  // Build the payload we will send to Resend.
  const payload = {
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  };

  // Enable debug logging when RESEND_DEBUG=1 or when not in production.
  const debug =
    process.env.RESEND_DEBUG === "1" || process.env.NODE_ENV !== "production";
  if (debug) {
    // eslint-disable-next-line no-console
    console.log(
      "[sendContactEmail] payload:",
      JSON.stringify(payload, null, 2),
    );
  }

  try {
    // Resend SDK uses `emails.send` with { from, to, subject, html, text }
    // https://resend.com/docs
    // Keep types loose here to avoid coupling to SDK internals.
    // @ts-ignore
    const res = await (resend as any).emails.send(payload);

    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[sendContactEmail] resend response:", res);
    }

    return res;
  } catch (err) {
    // Log detailed error along with payload to help debugging 'silent' failures.
    // eslint-disable-next-line no-console
    console.error("[sendContactEmail] error sending email", {
      error: err,
      payload,
    });
    // Re-throw so callers (API handlers) can respond with proper error details.
    throw err;
  }
}

export type SendContactEmailOpts = Parameters<typeof sendContactEmail>[0];
