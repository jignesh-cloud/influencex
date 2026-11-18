"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/services/activity-log/log-activity";
import {
  createContentGuidelineTemplateSchema,
  type CreateContentGuidelineTemplateInput,
} from "@/validators/content-guideline-template";

export async function createContentGuidelineTemplate(input: CreateContentGuidelineTemplateInput) {
  const user = await requireUser();
  const parsed = createContentGuidelineTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, clientId, rules } = parsed.data;

  const ruleList = rules
    .split("\n")
    .map((r) => r.trim())
    .filter(Boolean);

  const template = await prisma.contentGuidelineTemplate.create({
    data: { name, clientId: clientId || null, rules: ruleList },
  });

  await logActivity({
    entityType: "content_guideline_template",
    entityId: template.id,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "content_guideline_template_created",
    detail: { message: `${user.name} created content guideline template "${name}"` },
  });

  revalidatePath("/settings/content-guidelines");
  return { success: true };
}
