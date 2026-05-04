import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-14 space-y-4">
      <h1 className="font-orbitron text-3xl font-black">Terms of Service</h1>
      <p className="text-white/70">By using Blood Strike Scrim Hub, users agree to fair-play and community conduct standards.</p>
      <p className="text-white/50 text-sm">Full legal terms can be expanded as policies are finalized.</p>
    </section>
  );
}
