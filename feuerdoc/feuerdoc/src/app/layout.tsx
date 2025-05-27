import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Adjusted path
import Sidebar from "@/components/layout/Sidebar";

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
      <body className={`${inter.className} bg-black text-white`}> {/* Applied theme directly */}
        <div className="flex h-screen">
          <Sidebar />
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
