import type { Metadata, Viewport } from 'next';
import { SITE_URL, SITE_NAME } from '@/lib/seo';
import { GeistSans } from 'geist/font/sans';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'AEON Gulf | Business Setup in Kuwait, Qatar & Saudi Arabia', template: `%s | ${SITE_NAME}` },
  description:
    'Company formation, PRO and GRO services, annual compliance, accounting and relocation for businesses in Kuwait, Qatar and Saudi Arabia. Get a quote from AEON Gulf.',
  applicationName: SITE_NAME,
  icons: { icon: '/brand/aeon-mark.svg' },
  openGraph: { siteName: SITE_NAME, type: 'website', locale: 'en_GB' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#000000' };

// Hides reveal targets before first paint; if motion never starts, everything is shown after 4.5s.
const bootScript = `document.documentElement.classList.add('js');setTimeout(function(){if(!document.documentElement.classList.contains('motion-on'))document.documentElement.classList.add('motion-failed')},4500);
var p=location.pathname;if(p==='/ar'||p.indexOf('/ar/')===0){var h=document.documentElement;h.lang='ar';h.dir='rtl';}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
