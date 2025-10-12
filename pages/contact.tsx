import { NextPage, GetStaticProps } from "next";
import { NextSeo } from "next-seo";
import { styled, Box } from "../stitches.config";
import MenuBar from "../components/MenuBar";
import PageHeadline from "../components/PageHeadline";
import Footer from "../components/Footer";
import Layout from "../components/Layout";
import Button, { Loading } from "../components/Button";
import { useState } from "react";
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
      setError("الرجاء ملء جميع الحقول.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("الرجاء إدخال بريد إلكتروني صالح.");
      return;
    }

    setIsLoading(true);
    try {
      // For now do a client-only fake submit. Integrate with an API route later.
      await new Promise((r) => setTimeout(r, 700));
      setSuccess("تم إرسال رسالتك بنجاح. سنرد عليك عبر البريد الإلكتروني.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError("حدث خطأ أثناء إرسال الرسالة. حاول لاحقًا.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NextSeo title={`اتصل بنا - ${meta.headline}`} />
      <MenuBar />
      <Box css={{ textAlign: "center" }}>
        <PageHeadline>اتصل بنا</PageHeadline>
      </Box>

      <Box>
        <Form onSubmit={handleSubmit} dir="rtl">
          <div style={{ padding: "0 25px" }}>
            <Label htmlFor="name">الاسم</Label>

            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              // placeholder="الاسم الكامل"
              aria-label="الاسم"
            />
          </div>

          <div style={{ padding: "0 25px" }}>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // placeholder="you@example.com"
              aria-label="البريد الإلكتروني"
            />
          </div>

          <div style={{ padding: "0 25px" }}>
            <Label htmlFor="message">الرسالة</Label>
            <Textarea
              id="message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              aria-label="الرسالة"
            />
          </div>

          {error ? (
            <Box
              css={{ color: "$crimson11", fontWeight: 600, marginRight: "$2" }}
            >
              {error}
            </Box>
          ) : null}

          {success ? (
            <Box css={{ color: "$crimson12", fontWeight: 600 }}>{success}</Box>
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
            }}
          >
            <div>
              <Button
                css={{ background: "$crimson2" }}
                disabled={isLoading}
                onClick={() => {}}
              >
                {isLoading ? <Loading /> : "إرسال"}
              </Button>
            </div>
          </Box>
        </Form>
      </Box>

      <Footer {...meta} />
    </>
  );
};

// @ts-ignore
ContactPage.layout = Layout;

export default ContactPage;
