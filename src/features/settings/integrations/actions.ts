"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { requireRole } from "@/lib/auth";
import { encryptSecret } from "@/lib/encryption";
import { logActivity } from "@/services/activity-log/log-activity";
import {
  createAffiliateProgramSchema,
  type CreateAffiliateProgramInput,
} from "@/validators/affiliate-program";

export async function createAffiliateProgram(input: CreateAffiliateProgramInput) {
  const user = await requireRole("admin");
  const parsed = createAffiliateProgramSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { clientId, network, programName, externalProgramId, apiCredential } = parsed.data;

  const program = await prisma.affiliateProgram.create({
    data: {
      clientId,
      network,
      programName,
      externalProgramId: externalProgramId || null,
      credentials: apiCredential ? encryptSecret(apiCredential) : null,
      active: true,
    },
  });

  await logActivity({
    entityType: "affiliate_program",
    entityId: program.id,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "affiliate_program_created",
    detail: { message: `${user.name} added ${programName} (${network})` },
  });

  revalidatePath("/settings/integrations");
  return { success: true };
}

export async function toggleAffiliateProgramActive(programId: string, active: boolean) {
  const user = await requireRole("admin");

  const program = await prisma.affiliateProgram.update({ where: { id: programId }, data: { active } });

  await logActivity({
    entityType: "affiliate_program",
    entityId: programId,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "affiliate_program_toggled",
    detail: { message: `${user.name} ${active ? "activated" : "deactivated"} ${program.programName}` },
  });

  revalidatePath("/settings/integrations");
  return { success: true };
}
