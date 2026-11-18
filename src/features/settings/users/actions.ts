"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/db/prisma";
import { requireRole } from "@/lib/auth";
import { env } from "@/lib/env";
import { logActivity } from "@/services/activity-log/log-activity";
import { createUserSchema, type CreateUserInput } from "@/validators/user";
import type { UserRole } from "@/generated/prisma/enums";

export async function createUser(input: CreateUserInput) {
  const admin = await requireRole("admin");
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const { name, email, role } = parsed.data;

  if (!email.toLowerCase().endsWith(`@${env.ALLOWED_EMAIL_DOMAIN.toLowerCase()}`)) {
    return { error: `Email must be on the ${env.ALLOWED_EMAIL_DOMAIN} domain to ever sign in.` };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "A user with this email already exists." };
  }

  const user = await prisma.user.create({ data: { name, email, role } });

  await logActivity({
    entityType: "user",
    entityId: user.id,
    actorType: "user",
    actorId: admin.id,
    actorName: admin.name,
    action: "user_created",
    detail: { message: `${admin.name} added ${name} (${email}) as ${role}` },
  });

  revalidatePath("/settings/users");
  return { success: true };
}

export async function updateUserRole(userId: string, role: UserRole) {
  const admin = await requireRole("admin");

  if (role === "team_member") {
    const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (target.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return { error: "Cannot demote the last remaining admin." };
      }
    }
  }

  const updated = await prisma.user.update({ where: { id: userId }, data: { role } });

  await logActivity({
    entityType: "user",
    entityId: userId,
    actorType: "user",
    actorId: admin.id,
    actorName: admin.name,
    action: "user_role_changed",
    detail: { message: `${admin.name} changed ${updated.name}'s role to ${role}` },
  });

  revalidatePath("/settings/users");
  return { success: true };
}
