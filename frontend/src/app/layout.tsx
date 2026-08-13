import type { Metadata } from 'next';

import { Navbar } from '@/components/layout/Navbar';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'TGA Quiz — Guess the Winner',
  description: 'Explore o histórico do The Game Awards e teste sua memória sobre os vencedores.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-surface-muted text-gray-900" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Pular para o conteúdo principal
        </a>
        <Navbar />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
