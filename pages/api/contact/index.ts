import { NextApiRequest, NextApiResponse } from "next";
import { sendContactEmail } from "./config";

/**
 * POST /api/contact
 * Receives contact form data (name, email, message) and sends email via Resend.
 * Returns success/error response.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, email, message } = req.body;

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Basic email validation
  if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ error: "Invalid email" });
  }

  try {
    // Log the incoming request (debug)
    const debug =
      process.env.RESEND_DEBUG === "1" || process.env.NODE_ENV !== "production";
    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[/api/contact] received:", { name, email, message });
    }

    // Send email to shop contact address (admin notification)
    const shopContact = process.env.SHOP_CONTACT;
    if (!shopContact) {
      // eslint-disable-next-line no-console
      console.error("[/api/contact] error: SHOP_CONTACT not configured");
      return res.status(500).json({
        success: false,
        error: "Server misconfigured: SHOP_CONTACT not set",
      });
    }

    // First: notify shop/admin
    const adminResponse = await sendContactEmail({
      to: shopContact,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
      text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[/api/contact] adminResponse:", adminResponse);
    }

    // Then: send an automatic confirmation back to the sender
    let autoResponseResult: { success: boolean; id?: string; error?: string } = {
      success: false,
    };

    try {
      const shopName = process.env.SHOP_NAME || "M3D SHOP";
      const fromAddrRaw = process.env.SHOP_CONTACT || "koora-live.channel";
      // Add a display name when sending the auto-response (e.g. "Sassi-Wprojects <noreply@...>")
      const fromDisplay = shopName ? `${shopName} <${fromAddrRaw}>` : fromAddrRaw;
      const confirm = await sendContactEmail({
        to: email,
        from: fromDisplay,
        subject: `Thanks for contacting ${shopName}`,
        html: `
          <p>Hi ${name || "there"},</p>
          <p>Thanks for reaching out — we've received your message and will get back to you shortly.</p>
          <p>Best regards,<br/>${shopName} Team</p>
          <p style="margin-top:12px;">
        <img
          src="https://res.cloudinary.com/drkqvla4e/image/upload/m3d-shop_oey9z8.png"
          alt="${shopName} logo"
          style="display:block; width:128px; height:auto; object-fit:contain;"
          width="128"
        />
          </p>
        `,
        text: `Hi ${name || "there"},\n\nThanks for reaching out — we've received your message and will get back to you shortly.\n\nBest regards,\n${shopName} Team`,
      });

      autoResponseResult = { success: true, id: (confirm as any)?.id };
      if (debug) {
        // eslint-disable-next-line no-console
        console.log("[/api/contact] autoResponse:", confirm);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[/api/contact] auto-response failed:", err);
      autoResponseResult = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }

    // Return success with both message ids (admin and optional auto-response)
    return res.status(200).json({
      success: true,
      adminMessageId: (adminResponse as any)?.id,
      autoResponse: autoResponseResult,
      message: "Contact form submitted successfully",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[/api/contact] error:", error);

    // Return error response
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send contact form",
    });
  }
}
