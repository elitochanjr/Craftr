import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Craftr",
  description: "Crafting supply inventory management",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
