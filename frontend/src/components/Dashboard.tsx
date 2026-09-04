import React from 'react';
import { Wallet, Zap, Share2 } from 'lucide-react';
import { AuroraHero } from '@/components/AuroraHero';

const Dashboard = () => {
  return (
    <div className="space-y-16 pb-20">
      <div className="-mt-8 -mx-4 mb-8">
        <AuroraHero />
      </div>

      <section className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Wallet className="h-8 w-8 text-slate-900 dark:text-white" />}
            title="1. Connect"
            description="Login securely with your Phantom or Solflare wallet to sign transactions and verify ownership."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-slate-900 dark:text-white" />}
            title="2. Create"
            description="Choose from pre-built templates like Donations, Token Swaps, or Raffles. Customize visuals in seconds."
          />
          <FeatureCard
            icon={<Share2 className="h-8 w-8 text-slate-900 dark:text-white" />}
            title="3. Share"
            description="Get a unique URL. Paste it on X, and it instantly turns into an interactive button for your followers."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="card p-8 hover:shadow-md transition-shadow text-left border-t-4 border-t-transparent hover:border-t-slate-900 dark:hover:border-t-white dark:bg-black dark:border-slate-800">
    <div className="mb-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-16 h-16 rounded-2xl flex items-center justify-center">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
  </div>
);

export default Dashboard;
