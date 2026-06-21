import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavigationProgress } from "@/shared/components/layout/navigation-progress";
import { Nav } from "@/shared/components/layout/nav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SEU Campus Market",
  description: "A student marketplace for Southeast University."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Nav />
        {children}
      </body>
    </html>
  );
}
