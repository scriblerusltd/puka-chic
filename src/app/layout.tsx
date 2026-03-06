import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PUKA / CHIC",
  description: "Where does your brand fall on the spectrum?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-black">
        {children}
      </body>
    </html>
  );
}
