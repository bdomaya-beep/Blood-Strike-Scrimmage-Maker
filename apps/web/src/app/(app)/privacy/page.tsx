import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-14 space-y-4">
      <h1 className="font-orbitron text-3xl font-black">Privacy Policy</h1>
      <p className="text-white/70">This page describes what account and gameplay data is collected to run the platform.</p>
      <p className="text-white/50 text-sm">Detailed policy text can be updated before production launch.</p>
    </section>
  );
}
