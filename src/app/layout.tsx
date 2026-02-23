import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Removed duplicate Roboto/Playfair import
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
// Navbar and Footer are likely in a nested layout or page, not here for multi-tenancy if they depend on storeId
import { AuthProvider } from "@/lib/firebase/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { playfair, roboto } from "@/lib/fonts";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UnderDesk Flow | UDF",
  description: "Infraestructura operativa invisible para el comercio digital",
};

import { ThemeProvider } from "@/components/theme-provider";

// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${roboto.variable}`} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader showSpinner={false} color="#2563eb" />
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
