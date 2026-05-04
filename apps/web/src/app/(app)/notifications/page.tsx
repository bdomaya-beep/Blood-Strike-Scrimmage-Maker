import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notifications' };

export default function NotificationsPage() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-14">
      <h1 className="font-orbitron text-3xl font-black mb-3">Notifications</h1>
      <p className="text-white/60">Your match, event, and clan notifications will appear here.</p>
    </section>
  );
}
