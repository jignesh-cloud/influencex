import Link from "next/link";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/creators", label: "Creators" },
  { href: "/settings", label: "Settings" },
];

interface AppHeaderUser {
  name?: string | null;
  email?: string | null;
  role: string;
}

export function AppHeader({ user }: { user: AppHeaderUser }) {
  return (
    <header className="sticky top-0 z-10 bg-neutral-950 text-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-baseline gap-1 font-semibold tracking-tight">
            GROUP <span className="text-brand">8A</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-neutral-300">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="text-right leading-tight">
            <p className="text-neutral-200">{user.name ?? user.email}</p>
            <p className="text-xs text-neutral-500">{user.role === "admin" ? "Admin" : "Team member"}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
