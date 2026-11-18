import { prisma } from "@/db/prisma";

export async function getContentGuidelineTemplates() {
  return prisma.contentGuidelineTemplate.findMany({
    include: { client: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
}
