import Layout from "../components/Layout";
import MenuBar from "../components/MenuBar";
import Footer from "../components/Footer";
import PageHeadline from "../components/PageHeadline";
import BitcoinPayment from "../components/BitcoinPayment";
import { GetServerSideProps, NextPage } from "next";
import { Tmeta } from "../types";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { useI18n } from "../lib/i18n";

export const getServerSideProps: GetServerSideProps = async () => {
  const {
    headline = "قوالب و إضافات ووردبريس بنكهة عربية 😍 ",
    subheadline = "",
    contact = "",
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

const BitcoinPage: NextPage<{ meta: Tmeta }> = ({ meta }) => {
  const router = useRouter();

  // read query params (amount in cents, currency code)
  const amountParam = Array.isArray(router.query.amount)
    ? router.query.amount[0]
    : (router.query.amount as string | undefined);
  const currency = Array.isArray(router.query.currency)
    ? router.query.currency[0]
    : (router.query.currency as string | undefined) ?? "usd";

  const amountInCents = amountParam ? parseInt(amountParam, 10) : undefined;

  const { t } = useI18n();

  return (
    <>
      <NextSeo title={`${t("bitcoin.title")} - ${meta.headline}`} noindex={true} />
      <MenuBar />
      <PageHeadline>{t("bitcoin.title")}</PageHeadline>
      <BitcoinPayment amountInCents={amountInCents} currency={currency} />
      <Footer {...meta} />
    </>
  );
};

// @ts-ignore
BitcoinPage.layout = Layout;

export default BitcoinPage;
