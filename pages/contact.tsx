import { NextPage, GetStaticProps } from "next";
import { NextSeo } from "next-seo";
import { styled, Box } from "../stitches.config";
import MenuBar from "../components/MenuBar";
import PageHeadline from "../components/PageHeadline";
import Footer from "../components/Footer";
import Layout from "../components/Layout";
import Button, { Loading } from "../components/Button";
import { useState } from "react";
import { useI18n } from "../lib/i18n";
import { Tmeta } from "../types";

export const getStaticProps: GetStaticProps = async () => {
  const {
    headline = "قوالب و إضافات ووردبريس بنكهة عربية 😍 ",
    subheadline = "تصميم المواقع الخاصة بالشركات و المؤسسات و المواقع الشخصية والفنيه.",
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

const Form = styled("form", {
  display: "grid",
  gap: "$3",
  margin: "0 auto",
  width: "100%",
});

const Label = styled("label", {
  display: "block",
  fontWeight: 700,
  marginBottom: "$1",
  margin: "$2 0",
});

const Input = styled("input", {
  width: "calc(100% - $5)",
  padding: "$2",
  border: "1px solid $mauve6",
  borderRadius: "$2",
  background: "$mauve1",
  fontSize: "16px",
});

const Textarea = styled("textarea", {
  width: "calc(100% - $5)",
  minHeight: 160,
  padding: "$2",
  border: "1px solid $mauve6",
  borderRadius: "$2",
  background: "$mauve1",
  fontSize: "16px",
  resize: "vertical",
});

const ContactPage: NextPage<{ meta: Tmeta }> = ({ meta }) => {
  const { t, locale } = useI18n();
  const contactText = t("contact", meta?.contact ?? "") || meta?.contact;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t("contact.error_fill", "Please fill all fields."));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t("contact.error_email", "Please enter a valid email."));
      return;
    }

    setIsLoading(true);
    try {
      // Call the contact API endpoint to send email via Resend
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || t("contact.error_send", "Failed to send message"),
        );
        return;
      }

      setSuccess(
        t(
          "contact.success",
          "Your message was sent successfully. We'll reply by email.",
        ),
      );
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(
        t(
          "contact.error_network",
          "An error occurred while sending. Please try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NextSeo title={`اتصل بنا - ${meta.headline}`} />
      <MenuBar />
      <Box css={{ textAlign: "center" }}>
        <PageHeadline>{t("contact", "Contact")}</PageHeadline>
      </Box>

      <Box>
        <Form onSubmit={handleSubmit} dir={locale === "ar" ? "rtl" : "ltr"}>
          <div style={{ padding: "0 25px" }}>
            <Label htmlFor="name">{t("contact.name", "Name")}</Label>

            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              // placeholder={t("contact.name_placeholder", "Full name")}
              aria-label={t("contact.name", "Name")}
            />
          </div>

          <div style={{ padding: "0 25px" }}>
            <Label htmlFor="email">{t("contact.email", "Email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // placeholder={t("contact.email_placeholder", "you@example.com")}
              aria-label={t("contact.email", "Email")}
            />
          </div>

          <div style={{ padding: "0 25px" }}>
            <Label htmlFor="message">{t("contact.message", "Message")}</Label>
            <Textarea
              id="message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t(
                "contact.placeholder_message",
                "Write your message here...",
              )}
              aria-label={t("contact.message", "Message")}
            />
          </div>

          {error ? (
            <Box
              css={{
                color: "$crimson11",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {error}
            </Box>
          ) : null}

          {success ? (
            <Box
              css={{
                color: "$crimson12",
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              {success}
            </Box>
          ) : null}
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
              width: "100%",
              marginTop: "$5",
              direction: locale === "ar" ? "ltr" : "rtl",
            }}
          >
            <div>
              <Button
                css={{ background: "$crimson2" }}
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? <Loading /> : t("contact.send", "Send")}
              </Button>
            </div>
          </Box>
        </Form>
      </Box>

      <Footer {...meta} contact={contactText} />
    </>
  );
};

// @ts-ignore
ContactPage.layout = Layout;

export default ContactPage;
