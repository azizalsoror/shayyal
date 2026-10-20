import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "شيّال",
  description: "اعثر على عامل نظافة وأعمال بسيطة بالقرب منك، وتعاقد معه شهرياً بكل سهولة.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
