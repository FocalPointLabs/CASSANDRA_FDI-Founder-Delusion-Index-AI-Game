import { Html, Head, Main, NextScript } from "next/document";
import { teko, courierPrime } from "@/lib/fonts";
// className={`${teko.variable} ${courierPrime.variable}`}

export default function Document() {
  return (
    <Html lang="en" className={`${teko.variable} ${courierPrime.variable}`}>
      <Head />
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}