import { styled, Box } from "../stitches.config";
import type { Tmeta } from "../types";
import {
  TwitterLogoIcon,
  EnvelopeClosedIcon,
  ChatBubbleIcon,
  PaperPlaneIcon,
} from "@radix-ui/react-icons";
import Image from "next/image";


const Wrapper = styled("footer", {
  padding: "$4",
  marginTop: "$6",
  textAlign: "center",
});

const SocialsWrapper = styled("div", {
  display: "flex",
  justifyContent: "center",
  marginTop: "$2",
});

const Socials = styled("div", {
  display: "flex",
  gap: "$3",
  padding: "$2",
  // borderLeft: "1px solid $mauve6",
  // borderRight: "1px solid $mauve6",
  alignContent: "center",
  justifyContent: "center",
});

const SocialLink = styled("a", {
  display: "inline-grid",
  placeItems: "center",
  width: "44px",
  height: "44px",
  borderRadius: "4px",
  color: "$crimson11",
  textDecoration: "none",
  cursor: "pointer",
  // borderTop: "1px solid $mauve6",
  // borderBottom: "1px solid $mauve6",
  transition:
    "transform 180ms cubic-bezier(.2,.9,.3,1), box-shadow 180ms ease, background 160ms ease",
  transform: "translateY(0) scale(1)",
  variants: {
    ghost: {
      true: {
        background: "$mauve3",
      },
    },
  },
  "&:hover": {
    transform: "translateY(-4px) scale(1.06)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    background: "$mauve4",
  },
  "&:active": {
    transform: "translateY(-2px) scale(1.02)",
  },
  "& svg": {
    transition: "transform 180ms cubic-bezier(.2,.9,.3,1)",
  },
  "&:hover svg": {
    transform: "translateY(-2px)",
  },
});

// add responsive payment logo container
const PaymentLogo = styled("div", {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "96px",
  flex: "0 1 65px",
  "& img": {
    width: "100%",
    height: "auto",
    display: "block",
    objectFit: "contain",
  },
  "@media (max-width: 640px)": {
    width: "72px",
    flex: "0 1 56px",
  },
  "@media (max-width: 420px)": {
    width: "56px",
    flex: "0 1 48px",
  },
});

const Footer: React.FunctionComponent<Tmeta> = ({ name, contact }) => {
  return (
    <Wrapper>
      <strong>{contact}</strong>
      <SocialsWrapper>
        <Socials>
          {/* Telegram */}
          <SocialLink
            href="https://t.me/M0k0fi"
            target="_blank"
            rel="noreferrer noopener"
            title="Telegram"
            aria-label="Telegram"
            ghost
          >
            <PaperPlaneIcon />
          </SocialLink>

          {/* WhatsApp */}
          <SocialLink
            href="https://wa.me/32493622901"
            target="_blank"
            rel="noreferrer noopener"
            title="WhatsApp"
            aria-label="WhatsApp"
            ghost
          >
            <ChatBubbleIcon />
          </SocialLink>

          {/* Facebook */}
          <SocialLink
            href="https://facebook.com/AceDinari"
            target="_blank"
            rel="noreferrer noopener"
            title="Facebook"
            aria-label="Facebook"
            ghost
          >
            <TwitterLogoIcon />
          </SocialLink>

          {/* Email */}
          <SocialLink href="/contact" title="Email" aria-label="Email" ghost>
            <EnvelopeClosedIcon />
          </SocialLink>
        </Socials>
      </SocialsWrapper>
      {/* Payment logos */}
      <Box
        css={{
          display: "flex",
          justifyContent: "center",
          gap: "$3",
          marginTop: "35px",
          alignItems: "center",
          flexWrap: "wrap", // allow wrapping on small screens
        }}
      >
        <PaymentLogo>
          <Image src="/payments/bitcoin.svg" alt="Bitcoin" />
        </PaymentLogo>
        <PaymentLogo>
          <Image src="/payments/visa.svg" alt="Visa" />
        </PaymentLogo>
        <PaymentLogo>
          <Image src="/payments/mastercard.svg" alt="Mastercard" />
        </PaymentLogo>
        <PaymentLogo>
          <Image src="/payments/paypal.svg" alt="PayPal" />
        </PaymentLogo>
        <PaymentLogo>
          <Image src="/payments/bancontact.svg" alt="Bancontact" />
        </PaymentLogo>
      </Box>
    </Wrapper>
  );
};

export default Footer;
