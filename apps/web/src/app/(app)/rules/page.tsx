import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Competition Rules' };

export default function RulesPage() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-14 space-y-4">
      <h1 className="font-orbitron text-3xl font-black">Competition Rules</h1>
      <p className="text-white/70">General tournament and scrim rules are published here for all participants.</p>
      <p className="text-white/50 text-sm">Rulebook details can be updated per season and event format.</p>
    </section>
  );
}
