import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext"; // Import our provider

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QuizMaster Pro",
  description: "Advanced Quiz Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* Wrap everything */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}