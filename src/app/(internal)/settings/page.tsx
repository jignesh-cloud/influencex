import Link from "next/link";
import { prisma } from "@/db/prisma";
import { Card } from "@/components/ui/card";

export default async function SettingsOverviewPage() {
  const [userCount, templateCount, activeProgramCount] = await Promise.all([
    prisma.user.count(),
    prisma.contentGuidelineTemplate.count(),
    prisma.affiliateProgram.count({ where: { active: true } }),
  ]);

  const cards = [
    { href: "/settings/users", label: "Users", value: userCount, description: "Team members with access" },
    {
      href: "/settings/integrations",
      label: "Integrations",
      value: activeProgramCount,
      description: "Active affiliate programs",
    },
    {
      href: "/settings/content-guidelines",
      label: "Content Guidelines",
      value: templateCount,
      description: "Templates on file",
    },
    { href: "/settings/activity", label: "Activity Log", value: null, description: "Every workflow, block, and override" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.href} href={card.href}>
          <Card className="h-full gap-1 p-5 transition-shadow hover:shadow-md">
            <p className="font-semibold text-neutral-900">{card.label}</p>
            {card.value !== null ? <p className="text-2xl font-semibold text-neutral-900">{card.value}</p> : null}
            <p className="text-sm text-neutral-500">{card.description}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
