import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Adjusted path
import Sidebar from "@/components/layout/Sidebar";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FeuerDoc",
  description: "AI-powered documentation for fire departments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-slate-50 to-blue-50 dark:bg-gradient-to-br dark:from-black dark:to-gray-900 text-black dark:text-white transition-all duration-300`}>
        <ThemeProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
