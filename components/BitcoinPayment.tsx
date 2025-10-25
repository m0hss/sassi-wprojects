import { Box, styled } from "../stitches.config";
import Button from "./Button";
import { useI18n } from "../lib/i18n";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { currencyCodeToSymbol } from "../lib/stripeHelpers";

const QRWrapper = styled("div", {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "$3",
});

const Small = styled("small", {
  color: "$crimson11",
});

const AddressBox = styled("div", {
  fontFamily: "monospace",
  padding: "$2",
  border: "1px dashed $mauve6",
  borderRadius: "$2",
  background: "$mauve2",
});

const BitcoinPayment: React.FC<{
  amountInCents?: number;
  currency?: string;
}> = ({ amountInCents = 0, currency = "usd" }) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [btcAmount, setBtcAmount] = useState<string>("");

  // Address should be set as a public env var by the merchant
  const address = process.env.NEXT_PUBLIC_BITCOIN_ADDRESS;

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const { t } = useI18n();

  const currencySymbol = currency ? currencyCodeToSymbol(currency) : "";
  const amount = (amountInCents ?? 0) / 100;

  const copy = async (text: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (err) {
      console.warn("Copy failed", err);
    }
  };

  return (
    <QRWrapper>
      <Box css={{ textAlign: "center" }}>
        <h2>{t("bitcoin.title")}</h2>
        <Small>
          {t("bitcoin.instructions_prefix")} <strong>{currencySymbol} {amount}</strong> {t("bitcoin.instructions_suffix")}
        </Small>
      </Box>

      <Box>
        {/* The merchant should add their QR code SVG to public/payments/qr-code.svg */}
        <img
          src="/payments/qr-code.svg"
          alt="Bitcoin QR code"
          style={{ width: 260, height: 260, objectFit: "contain", borderRadius: 4 }}
          onError={(e) => {
            // no-op: image missing -> user will see fallback below
          }}
        />
      </Box>

      {!address && (
        <Box css={{ color: "$crimson11", padding: "$2", textAlign: "center" }}>
          <strong>{t("bitcoin.no_address_title")}</strong>
          <br />
          {t("bitcoin.no_address_instructions")}
        </Box>
      )}

      {address && (
        <>
          <AddressBox>
            <div style={{ marginBottom: 15 }}>{address}</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button onClick={() => copy(address)}>{copied ? t("bitcoin.copy_address") + "ed" : t("bitcoin.copy_address")}</Button>
            </div>
          </AddressBox>
          
       {/*    <Box css={{ display: "flex", gap: 12, alignItems: "center", marginTop: "$2" }}>
            <label style={{ fontWeight: 600, minWidth: 120 }}>BTC amount</label>
            <input
              type="text"
              value={btcAmount}
              onChange={(e) => setBtcAmount(e.target.value)}
              placeholder="Optional (e.g. 0.00123)"
              style={{ padding: 8, borderRadius: 4, border: "1px solid #ddd" }}
            />
          </Box> */}
          
          {/* Open in wallet moved here so it's placed directly under the BTC amount input */}
        {/*   <Box css={{ display: "flex", gap: 12, marginTop: "$2" }}>
            <Button
              onClick={() => {
                const uri = `bitcoin:${address}${btcAmount ? `?amount=${btcAmount}` : ""}`;
                window.location.assign(uri);
              }}
            >
              Open in wallet
            </Button>
          </Box> */}

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
                width: "100%",
              }}
            >
              <Button onClick={() => router.push("/confirmation?method=bitcoin")}>{t("bitcoin.i_paid_continue")}</Button>
              <Button onClick={() => router.push("/cart")}>{t("bitcoin.back_to_cart")}</Button>
            </Box>
        </>
      )}
    </QRWrapper>
  );
};

export default BitcoinPayment;
