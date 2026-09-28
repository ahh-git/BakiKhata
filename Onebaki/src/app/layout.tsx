import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Outfit } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/context/SessionProvider";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind",
});

export const metadata: Metadata = {
  title: "Onebaki — দোকানের বাকি খাতা",
  description: "দোকানদার ও কাস্টমারের জন্য স্বচ্ছ বাকি হিসাব",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "Onebaki", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f6f8fc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className={`${outfit.variable} ${hind.variable}`}>
        <SessionProvider>{children}</SessionProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`,
          }}
        />
      </body>
    </html>
  );
}
