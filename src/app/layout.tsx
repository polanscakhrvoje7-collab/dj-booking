import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ThemeColorSwitcher } from "@/components/ThemeColorSwitcher";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "DJ Hrcoy — Rezervacije i Dostupnost",
  description:
    "Rezervirajte vaš događaj s DJ Hrcoy. Provjerite dostupnost i pošaljite zahtjev za rezervaciju.",
  openGraph: {
    title: "DJ Hrcoy — Rezervacije i Dostupnost",
    description: "Profesionalne DJ usluge. Provjerite dostupnost i rezervirajte vaš datum.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="hr" className={`${spaceGrotesk.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster position="top-right" richColors />
          <ThemeColorSwitcher />
        </ThemeProvider>
      </body>
    </html>
  );
}
