import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import { prisma } from "@/db/prisma";
import { env } from "@/lib/env";

/**
 * Invite-only access model: admins create a User row via /settings/users
 * *before* anyone signs in. Google Workspace OAuth then links to that
 * existing row by email.
 *
 * allowDangerousEmailAccountLinking is enabled deliberately: Auth.js's
 * default (false) would otherwise refuse to link a first-time Google
 * sign-in to the pre-existing admin-created row (no Account exists yet)
 * and instead attempt to create a second User with the same email, which
 * violates our unique constraint. This is the documented safe case for
 * that flag — Google Workspace verifies email ownership, and it's the
 * only provider configured.
 *
 * Self-service sign-up is blocked at the adapter level: createUser is
 * overridden to always reject, so nobody without a pre-existing admin-
 * created row can ever get a User record, regardless of what email they
 * authenticate with.
 */
const baseAdapter = PrismaAdapter(prisma);

const adapter: Adapter = {
  ...baseAdapter,
  async createUser() {
    throw new Error(
      "Self-service sign-up is disabled. An admin must create your account in /settings/users before you can sign in.",
    );
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "database" },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Defense-in-depth: the adapter override above is the real gate, but
      // also reject if an admin-created row somehow has the wrong domain.
      if (!user.email?.toLowerCase().endsWith(`@${env.ALLOWED_EMAIL_DOMAIN.toLowerCase()}`)) {
        console.error(`[auth] Rejected sign-in for out-of-domain email: ${user.email}`);
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as { role?: "admin" | "team_member" }).role ?? "team_member";
      }
      return session;
    },
  },
});
