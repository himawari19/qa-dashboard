import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppWrapper } from "@/components/app-wrapper";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QA Daily Hub",
  description: "Professional QA Activity and Test Case Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppWrapper>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AppWrapper>
        <Toaster />
      </body>
    </html>
  );
}
