import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import SolanaProvider from '@/components/SolanaProvider';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GradientBackground } from '@/components/ui/gradient-background';
import { Toaster } from 'sonner';

const neueHaas = localFont({
  src: [
    {
      path: '../../public/fonts/NeueHaasDisplayLight.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/NeueHaasDisplayMedium.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/NeueHaasDisplayMedium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/NeueHaasDisplayMediumItalic.ttf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../public/fonts/NeueHaasDisplayMediumItalic.ttf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../../public/fonts/NeueHaasDisplayBold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/NeueHaasDisplayBlack.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-neue-haas',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Blinklet',
  description:
    'Helps you create Solana Blinks easily to share on social, turning any link into an embeddable action button for payments and swaps.',
  icons: {
    icon: '/main-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${neueHaas.variable} font-sans bg-slate-50 text-slate-900 dark:bg-black dark:text-slate-50 transition-colors duration-300`}
      >
        <SolanaProvider>
          <Toaster position="bottom-center" richColors theme="system" />
          <GradientBackground />
          <div className="min-h-screen flex flex-col relative z-0">
            <Navbar />
            <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">{children}</main>
            <Footer />
          </div>
        </SolanaProvider>
      </body>
    </html>
  );
}
