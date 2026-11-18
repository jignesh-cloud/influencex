import Link from "next/link";

const TABS = [
  { href: "/settings", label: "Overview" },
  { href: "/settings/users", label: "Users" },
  { href: "/settings/integrations", label: "Integrations" },
  { href: "/settings/content-guidelines", label: "Content Guidelines" },
  { href: "/settings/activity", label: "Activity Log" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
        <nav className="mt-3 flex gap-4 border-b border-neutral-200 text-sm">
          {TABS.map((tab) => (
            <Link key={tab.href} href={tab.href} className="pb-2 text-neutral-600 hover:text-neutral-900">
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
