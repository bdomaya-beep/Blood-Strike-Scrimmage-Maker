import { SiteNav } from '@/components/layout/nav';
import { SiteFooter } from '@/components/layout/footer';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
