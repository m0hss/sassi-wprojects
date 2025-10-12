import type { NextPage } from "next";
import type { AppProps } from "next/app";
import { globalStyles, darkTheme } from "../stitches.config";
import { ThemeProvider } from "next-themes";
// Remove IdProvider import
import { CartProvider } from "../lib/cart";

type NextPageWithLayout = NextPage & {
  layout?: React.FC<{ children: React.ReactNode }>;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const PageLayout = Component.layout ?? (({ children }) => children);
  globalStyles();
  return (
    // Remove IdProvider wrapper
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      value={{
        dark: darkTheme.className,
        light: "light",
      }}
    >
      <CartProvider>
        <PageLayout>
          <Component {...pageProps} />
        </PageLayout>
      </CartProvider>
    </ThemeProvider>
  );
}
export default MyApp;