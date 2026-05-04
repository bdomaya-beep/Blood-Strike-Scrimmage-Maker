import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Announcements' };

export default function AnnouncementsPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="font-orbitron text-3xl font-black mb-3">Announcements</h1>
      <p className="text-white/60">Official updates, tournament notices, and platform news will appear here.</p>
    </section>
  );
}
