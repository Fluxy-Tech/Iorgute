import type { Metadata, Viewport } from "next";
import { Kalam, Nunito } from "next/font/google";
import { AppToaster } from "@/components/app-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const kalam = Kalam({ variable: "--font-kalam", subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: { default: "Iorgutê — iogurte artesanal", template: "%s · Iorgutê" },
  description: "Iogurte artesanal 100% natural. Peça, acompanhe e devolva suas garrafas para ganhar desconto.",
};

export const viewport: Viewport = {
  themeColor: "#74213A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${kalam.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <AppToaster />
      </body>
    </html>
  );
}
