import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { UserRole } from "@/generated/prisma/enums";

/**
 * Server-side authorization gate. Every Server Action and route handler that
 * mutates data must call this (or requireRole) directly — UI hiding a button
 * is not an authorization boundary.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (user.role !== role) {
    throw new ForbiddenError(`This action requires the "${role}" role.`);
  }
  return user;
}
