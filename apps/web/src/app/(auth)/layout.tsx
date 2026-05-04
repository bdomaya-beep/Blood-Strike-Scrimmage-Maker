export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-900">
      <div className="absolute inset-0 bg-glow-red pointer-events-none" />
      {children}
    </div>
  );
}
