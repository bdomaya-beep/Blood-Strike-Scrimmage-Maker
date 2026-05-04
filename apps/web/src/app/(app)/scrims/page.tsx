import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Scrims' };

export default function ScrimsPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="font-orbitron text-3xl font-black mb-3">Scrims</h1>
      <p className="text-white/60 mb-8">Scrim listing is being rolled out. Browse active events for now.</p>
      <Link
        href="/events"
        className="inline-flex px-5 py-2.5 rounded-lg border border-white/15 text-white/80 hover:text-white hover:border-neon-red/50 transition-colors"
      >
        Go to Events
      </Link>
    </section>
  );
}
