import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Chart Assassin — Pro',
  description:
    'Elite real-time trading assistant delivering tactical market structure reads and risk management tooling.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} bg-background text-foreground`}>{children}</body>
    </html>
  );
}
