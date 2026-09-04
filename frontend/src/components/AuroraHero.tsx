'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function AuroraHero() {
  return (
    <div className="h-[40rem] min-h-[60vh] flex flex-col items-center justify-center bg-transparent transition-colors duration-300">
      <div className="relative flex flex-col gap-6 items-center justify-center px-4 text-center z-10 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold dark:text-white text-slate-900 tracking-tight leading-tight">
          Create{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9945FF] to-[#14F195]">
            Blinks
          </span>{' '}
          without code
        </h1>
        <p className="font-light text-xl md:text-2xl dark:text-neutral-400 text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Blinklet helps you create Solana Blinks easily to share on social, turning any link into
          an embeddable action button for payments and swaps.
        </p>
        <Link
          href="/create"
          className="btn btn-primary text-lg px-8 py-3 shadow-lg shadow-slate-200 dark:shadow-[#9945FF]/20 flex items-center rounded-full hover:scale-105 transition-transform border border-transparent hover:border-[#14F195]/50"
        >
          Start Building <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
