This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Bitcoin payment setup

This project includes a simple Bitcoin payment UI that displays a merchant QR code and wallet address for manual on-chain payments.

To enable it:

- Place your QR code SVG (the file you uploaded) at `public/payments/qr-code.svg`.
- Set your wallet address in a public environment variable so it is available on the client:

	- In development, add to `.env.local`:

		NEXT_PUBLIC_BITCOIN_ADDRESS=yourbitcoinaddresshere

- From the cart page, choose the Bitcoin payment method and click the purchase button. You'll be routed to `/bitcoin-payment` which shows the QR code and address. After sending funds from your wallet, click "I paid — continue" to clear the cart and reach the confirmation screen. Note: this flow does not do automatic on-chain verification — you'll need to verify payments manually or extend the server with a block explorer/webhook integration.

