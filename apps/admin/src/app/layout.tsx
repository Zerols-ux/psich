import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Sidebar } from '@/components/Sidebar';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-serif',
});

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Psyplatform · Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${playfair.variable} ${inter.variable}`}>
      <body className="flex min-h-screen bg-bg text-text">
        <Sidebar />
        <div className="flex-1 p-10">{children}</div>
      </body>
    </html>
  );
}
