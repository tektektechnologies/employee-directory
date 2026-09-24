import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mathematics, Inc. Directory",
  description: "Find and connect with colleagues across Mathematics, Inc.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
