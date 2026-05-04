import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-surface-900 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <div className="font-orbitron font-black text-lg mb-3">
            <span className="neon-text">BS</span>
            <span className="text-white/80">SH</span>
          </div>
          <p className="text-white/30 text-xs leading-relaxed">
            The premier competitive platform for Blood Strike esports.
          </p>
        </div>

        {[
          {
            title: 'Platform',
            links: [
              { href: '/events', label: 'Events' },
              { href: '/scrims', label: 'Scrims' },
              { href: '/clans', label: 'Clans' },
              { href: '/leaderboard', label: 'Leaderboard' },
            ],
          },
          {
            title: 'Community',
            links: [
              { href: '/announcements', label: 'Announcements' },
              { href: '/streams', label: 'Live Streams' },
            ],
          },
          {
            title: 'Legal',
            links: [
              { href: '/privacy', label: 'Privacy Policy' },
              { href: '/terms', label: 'Terms of Service' },
              { href: '/rules', label: 'Competition Rules' },
            ],
          },
        ].map((col) => (
          <div key={col.title}>
            <h4 className="text-white/50 text-xs uppercase tracking-widest mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/30 text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
        <p className="text-white/20 text-xs">
          © {new Date().getFullYear()} Blood Strike Scrim Hub. Not affiliated with NetEase or Garena.
        </p>
        <p className="text-white/10 text-xs">Built for the community ♥</p>
      </div>
    </footer>
  );
}
