"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/services/activity-log/log-activity";
import { createClientSchema } from "@/validators/client";

export async function createClient(_prevState: unknown, formData: FormData) {
  const user = await requireUser();

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    standingContentGuidelines: formData.get("standingContentGuidelines"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, contactName, contactEmail, standingContentGuidelines } = parsed.data;

  const client = await prisma.client.create({
    data: {
      name,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      standingContentGuidelines: standingContentGuidelines || null,
    },
  });

  await logActivity({
    entityType: "client",
    entityId: client.id,
    actorType: "user",
    actorId: user.id,
    actorName: user.name,
    action: "client_created",
    detail: { name: client.name, message: `New client added: ${client.name}` },
  });

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}
