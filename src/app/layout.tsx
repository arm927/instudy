
import type { Metadata } from "next";
import "../styles/globals.css";
import "../styles/auth.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "InStudy",
  description:
    "Your little space to learn, organize, and grow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
