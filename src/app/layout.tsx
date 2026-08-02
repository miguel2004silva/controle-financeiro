import type { Metadata } from "next";
import { FinanceProvider } from "@/context/finance-context";
import { LayoutWrapper } from "@/components/layout-wrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Controle Financeiro Premium | Dashboard",
  description: "Gerenciamento de despesas e investimentos de alta performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', savedTheme);
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="antialiased">
        <FinanceProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </FinanceProvider>
      </body>
    </html>
  );
}
