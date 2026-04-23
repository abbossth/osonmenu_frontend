import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Metadata } from "next";
import "./globals.css";

/** Fallback when middleware is bypassed; real titles come from `[locale]/layout` metadata. */
export const metadata: Metadata = {
  title: "OsonMenu",
  description: "Smart digital menus for restaurants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
