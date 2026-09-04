import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import InteractiveBlink from '@/components/InteractiveBlink';
import { config } from '@/config';

type Props = {
  params: Promise<{ id: string }>;
};

async function getBlink(id: string) {
  try {
    const res = await fetch(`${config.apiUrl}/api/actions/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return undefined;
    return res.json();
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const blink = await getBlink(id);

  if (!blink) {
    return {
      title: 'Blink Not Found',
    };
  }

  return {
    title: blink.title,
    description: blink.description,
    openGraph: {
      title: blink.title,
      description: blink.description,
      images: [blink.icon],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: blink.title,
      description: blink.description,
      images: [blink.icon],
    },
  };
}

export default async function BlinkPage({ params }: Props) {
  const { id } = await params;
  const blink = await getBlink(id);

  if (!blink) {
    notFound();
  }

  const blinkUrl = `${config.shareBaseUrl}/api/actions/${id}`;
  const dialectUrl = `${config.dialectBaseUrl}${encodeURIComponent(blinkUrl)}`;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <InteractiveBlink blink={blink} />

      <div className="text-center space-y-4">
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          This is a Solana Action (Blink).
          <br />
          Interact above or launch on Dialect.
        </p>

        <a
          href={dialectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 btn btn-secondary px-6 py-3 rounded-full text-sm"
        >
          Launch on Dialect <ExternalLink className="w-4 h-4" />
        </a>

        <div className="pt-4">
          <Link
            href="/create"
            className="text-sm text-[#9945FF] hover:text-[#14F195] transition-colors"
          >
            Create your own Blink
          </Link>
        </div>
      </div>
    </div>
  );
}
