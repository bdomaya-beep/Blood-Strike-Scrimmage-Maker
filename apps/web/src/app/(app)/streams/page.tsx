import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Live Streams' };

export default function StreamsPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="font-orbitron text-3xl font-black mb-3">Live Streams</h1>
      <p className="text-white/60">Live match broadcasts and featured creators will be listed here.</p>
    </section>
  );
}
