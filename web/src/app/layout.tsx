import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
import { SiteFooter, SiteHeader } from '../components/site.js';

export const metadata: Metadata = {
  title: { default: 'ChogBound', template: '%s | ChogBound' },
  description: 'Your Chog. Your plan. Your fight.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><div className="wrap"><SiteHeader />{children}<SiteFooter /></div></body></html>;
}
