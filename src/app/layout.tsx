import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { LimitModalProvider } from "@/hooks/useLimitModal";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n";
import { FeedbackButton } from "@/components/FeedbackButton";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIDORag - AI-Powered Document Intelligence",
  description: "Transform your documents into intelligent conversations with AI-powered RAG technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <AuthProvider>
              <LimitModalProvider>
                {children}
                <FeedbackButton />
              </LimitModalProvider>
            </AuthProvider>
          </I18nProvider>
          <Toaster />
        </ThemeProvider>

        {/* AIDORag Chat Widget */}
        <Script
          src="/widget/aidorag-widget.js"
          data-widget-key="wgt_6f6c81f1bdf1acd6f61e0e7eeef114206d67147f3432f720"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
