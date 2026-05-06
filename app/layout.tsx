import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppWrapper } from "@/components/app-wrapper";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "QA Daily Hub | Quality Ops Workspace",
    template: "%s | QA Daily Hub",
  },
  description: "A polished workspace for QA teams to manage test cases, execution, bugs, and daily activity.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
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
