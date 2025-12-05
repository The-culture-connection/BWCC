import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import ConditionalLayout from "@/components/ConditionalLayout";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: '--font-cursive',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "Black Women Cultivating Change | Mental Health Advocacy",
  description: "Black Women Cultivating Change (BWCC) is a 501(c)(3) that advocates, educates, and provides platforms to eliminate the stigmas associated with mental health in the Black Community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dancingScript.variable} font-secondary`}>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  );
}

