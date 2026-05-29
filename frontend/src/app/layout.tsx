import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kham Hoa | Luxury Jewelry",
  description: "Exquisite collection of luxury jewelry, wedding rings, and fine diamonds.",
};

import { AuthProvider } from "@/lib/AuthContext";
import { CartProvider } from "@/lib/CartContext";
import { FloatingChatWidget } from "@/components/layout/FloatingChatWidget";
import { ToastProvider } from "@/components/ui/ToastContext";
import { ConfirmProvider } from "@/components/ui/ConfirmContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased`}
      >
        <ToastProvider>
          <ConfirmProvider>
            <AuthProvider>
              <CartProvider>
                {children}
                <FloatingChatWidget />
              </CartProvider>
            </AuthProvider>
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

