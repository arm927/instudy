import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InStudy",
  description: "Your little space to learn, organize, and grow.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
