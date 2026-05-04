import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-glow-red pointer-events-none" />

      {/* Hero */}
      <section className="relative z-10 text-center px-6 py-24 max-w-4xl mx-auto">
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon-red/40 bg-neon-red/10 text-neon-red text-xs font-orbitron uppercase tracking-widest">
          <span className="animate-pulse-neon w-1.5 h-1.5 rounded-full bg-neon-red" />
          Season 1 Now Live
        </div>

        <h1 className="font-orbitron text-5xl md:text-7xl font-black leading-none tracking-tight mb-6">
          <span className="neon-text">Blood Strike</span>
          <br />
          <span className="text-white">Scrim Hub</span>
        </h1>

        <p className="text-white/60 text-lg md:text-xl font-rajdhani max-w-2xl mx-auto mb-10">
          The premier competitive platform for Blood Strike. Organize scrimmages, run tournaments,
          track standings in real-time, and dominate the leaderboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-lg font-orbitron text-sm font-bold tracking-wider uppercase gradient-brand text-white shadow-neon hover:opacity-90 transition-opacity"
          >
            Join Now — It's Free
          </Link>
          <Link
            href="/events"
            className="px-8 py-3.5 rounded-lg font-orbitron text-sm font-bold tracking-wider uppercase border border-white/20 text-white/80 hover:border-neon-red/50 hover:text-white transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-24 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Registered Players', value: '12,400+' },
          { label: 'Clans', value: '1,200+' },
          { label: 'Matches Played', value: '48,000+' },
          { label: 'Prize Distributed', value: '$24,000' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 text-center">
            <div className="font-orbitron text-2xl font-black text-neon-red mb-1">{stat.value}</div>
            <div className="text-white/50 text-xs uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
