import type { Metadata } from 'next';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Zaytoon Atelier — Palestinian Heritage Fashion',
  description:
    'Discover contemporary Palestinian fashion shaped by heritage, craft, and thoughtful design.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
