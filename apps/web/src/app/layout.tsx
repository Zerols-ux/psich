import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
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
  title: {
    default: 'Psyplatform — психологічна освітня платформа',
    template: '%s · Psyplatform',
  },
  description:
    'Авторські курси з психології для тих, хто готовий до глибоких змін. Практичні інструменти, живі вебінари, підтримка спільноти.',
};

export const viewport: Viewport = {
  themeColor: '#0D0D0D',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-bg text-text">
        <Navigation />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
