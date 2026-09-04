'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="btn btn-secondary h-9 w-9 cursor-pointer rounded-full border-none bg-transparent px-0 hover:bg-slate-100 dark:hover:bg-slate-800"
      aria-label="Toggle theme"
    >
      <Sun className="hidden h-[1.2rem] w-[1.2rem] dark:block" />
      <Moon className="h-[1.2rem] w-[1.2rem] dark:hidden" />
    </button>
  );
}
