import type { Metadata, Viewport } from "next";
import { Lora, Nunito } from "next/font/google";
import "./globals.css";
import { SideDock } from "@/app/components/SideDock";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "ilm.io — Learning that understands you",
  description:
    "An AI-powered platform that transforms study materials into accessible content designed for neurodivergent learners.",
};

const darkInitScript = `
try {
  var d = localStorage.getItem('ilm-dark');
  if (d === 'true' || (!d && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch(e) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lora.variable} ${nunito.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <SideDock />
      </body>
    </html>
  );
}
