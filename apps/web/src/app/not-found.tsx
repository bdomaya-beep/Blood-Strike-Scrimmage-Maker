import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <div className="font-orbitron font-black text-9xl text-white/5 mb-4 select-none">404</div>
      <h1 className="font-orbitron font-black text-2xl text-white mb-3">Page Not Found</h1>
      <p className="text-white/40 text-sm mb-8 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-lg font-orbitron text-sm font-bold uppercase tracking-wider gradient-brand text-white shadow-neon hover:opacity-90 transition-opacity"
      >
        Back to Home
      </Link>
    </div>
  );
}
