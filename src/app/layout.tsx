import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Craftr",
  description: "Crafting supply inventory management",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const accent = session?.user?.accentColor ?? "neutral";

  return (
    <html
      lang="en"
      className="h-full"
      data-accent={accent}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased bg-background text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
