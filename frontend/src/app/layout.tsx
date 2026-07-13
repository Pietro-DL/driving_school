import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scuola Guida",
  description:
    "Studia per la patente di guida con lezioni, video e quiz interattivi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950">
        {/* AuthProvider wraps the entire tree so every component shares
            one auth state instance (see src/contexts/AuthContext.tsx). */}
        <AuthProvider>
          <Navbar />
          <div className="flex flex-col flex-1">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
