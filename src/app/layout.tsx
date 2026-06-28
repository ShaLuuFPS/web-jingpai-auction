import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BidNotificationBar from "@/components/BidNotificationBar";
import NavigationLoader from "@/components/NavigationLoader";
import { getCurrentUser } from "@/lib/session";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "竞拍系统",
  description: "车辆竞拍系统",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN" className={`h-full antialiased ${inter.className}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Navbar user={user} />
        <BidNotificationBar />
        <NavigationLoader>
          <main className="flex-1 container mx-auto max-w-7xl px-4 py-6 md:py-12">
            {children}
          </main>
        </NavigationLoader>
      </body>
    </html>
  );
}
