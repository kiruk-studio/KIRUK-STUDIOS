import type { Metadata } from 'next';
import {
  EB_Garamond,
  IM_Fell_Double_Pica,
  IM_Fell_English,
  IM_Fell_English_SC,
  JetBrains_Mono,
  Xanh_Mono,
} from 'next/font/google';
import AppLoader from '@/components/ui/app-loader';
import { INK_BOOT_CSS, INK_BOOT_SCRIPT } from '@/components/ui/loader/ink/boot';
import './globals.css';

const fell = IM_Fell_English({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-fell',
});

const fellSC = IM_Fell_English_SC({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-fell-sc',
});
const fellDP = IM_Fell_Double_Pica({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-fell-dp',
});
const garamond = EB_Garamond({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-garamond',
});
const xanh = Xanh_Mono({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-xanh',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'kiruk',
  description: 'An art + code studio.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fell.variable} ${fellSC.variable} ${fellDP.variable} ${xanh.variable} ${garamond.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preload" href="/favicon.svg" as="image" />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant authored in this repo, not user input */}
        <style dangerouslySetInnerHTML={{ __html: INK_BOOT_CSS }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant authored in this repo, not user input */}
        <script dangerouslySetInnerHTML={{ __html: INK_BOOT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <AppLoader enableLoader>{children}</AppLoader>
      </body>
    </html>
  );
}
