import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { AuthAwareLayout } from "@/components/layouts/auth-aware-layout";
import { Providers } from './providers'

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AuthAwareLayout>{children}</AuthAwareLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}