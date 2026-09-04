'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Plus, LayoutGrid } from 'lucide-react';

import { ThemeToggle } from './ThemeToggle';

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false },
);

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-black/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10">
              <Image src="/main-logo.png" alt="Blinklet Logo" fill className="object-contain" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#9945FF] group-hover:to-[#14F195] transition-all">
                Blinklet
              </span>
              <span className="text-[0.65rem] font-medium text-slate-500 dark:text-slate-400 tracking-wide">
                by Choplet Studios
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/my-blinks"
              className={`hidden sm:flex items-center gap-2 text-sm font-medium transition-colors ${
                pathname === '/my-blinks'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#9945FF] dark:hover:text-[#14F195]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              My Blinks
            </Link>

            {pathname !== '/create' && (
              <Link
                href="/create"
                className="hidden sm:flex items-center gap-2 btn btn-primary shadow-lg shadow-slate-500/20 dark:shadow-none hover:border-[#14F195]/50 border border-transparent"
              >
                <Plus className="w-4 h-4" />
                Create Blink
              </Link>
            )}

            <div className="wallet-adapter-dropdown">
              <WalletMultiButton className="!bg-slate-900 dark:!bg-white dark:!text-black hover:!bg-slate-800 dark:hover:!bg-slate-200 transition-colors" />
            </div>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
