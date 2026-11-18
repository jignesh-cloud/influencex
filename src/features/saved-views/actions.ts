"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { createSavedViewSchema, type CreateSavedViewInput } from "@/validators/saved-view";
import type { Prisma } from "@/generated/prisma/client";

export async function createSavedView(input: CreateSavedViewInput) {
  const user = await requireUser();
  const parsed = createSavedViewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const data = parsed.data;

  await prisma.savedView.create({
    data: {
      userId: user.id,
      name: data.name,
      pageScope: data.pageScope,
      campaignId: data.pageScope === "campaign_dashboard" ? (data.campaignId ?? null) : null,
      columnConfig: data.columnConfig as Prisma.InputJsonValue,
      sortConfig: data.sortConfig as Prisma.InputJsonValue,
      filterConfig: data.filterConfig as Prisma.InputJsonValue,
    },
  });

  if (data.campaignId) revalidatePath(`/campaigns/${data.campaignId}`);
  revalidatePath("/creators");
  return { success: true };
}

export async function deleteSavedView(viewId: string) {
  const user = await requireUser();
  const view = await prisma.savedView.findUniqueOrThrow({ where: { id: viewId } });
  if (view.userId !== user.id) {
    throw new Error("You can only delete your own saved views.");
  }
  await prisma.savedView.delete({ where: { id: viewId } });
  if (view.campaignId) revalidatePath(`/campaigns/${view.campaignId}`);
  revalidatePath("/creators");
}
