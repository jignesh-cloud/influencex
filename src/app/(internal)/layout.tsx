import { AppHeader } from "@/components/layout/app-header";
import { requireUser } from "@/lib/auth";

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader user={user} />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
