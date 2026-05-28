import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tee Stitches of Bida | Luxury Fashion Designer",
  description:
    "A cinematic fashion portfolio for Tee Stitches of Bida, tailoring bridal, native, runway, ready-to-wear, and luxury gown experiences.",
  openGraph: {
    title: "Tee Stitches of Bida",
    description: "Crafting elegance beyond fabric.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
