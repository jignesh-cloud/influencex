import { z } from "zod";

/**
 * Single source of truth for environment variables. Import `env` instead of
 * reading `process.env` directly so a missing/invalid var fails fast at boot
 * with a clear message rather than surfacing as a runtime error deep in a
 * service call.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // App / Auth
  NEXTAUTH_URL: z.url().optional(),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),

  // Google Workspace SSO
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  ALLOWED_EMAIL_DOMAIN: z.string().min(1).default("group8a.com"),

  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Encryption (affiliate credentials at rest)
  ENCRYPTION_KEY: z
    .string()
    .min(32, "ENCRYPTION_KEY must be at least 32 characters (used as AES-256-GCM key material)"),

  // AI
  AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-5.5"),

  // Creator data provider
  CREATOR_PROVIDER: z.enum(["mock"]).default("mock"),

  // Affiliate networks
  AFFILIATE_IMPACT_MODE: z.enum(["mock", "live"]).default("mock"),
  AFFILIATE_IMPACT_API_KEY: z.string().optional(),
  AFFILIATE_AWIN_MODE: z.enum(["mock", "live"]).default("mock"),
  AFFILIATE_AWIN_API_KEY: z.string().optional(),
  AFFILIATE_AVANTLINK_MODE: z.enum(["mock", "live"]).default("mock"),
  AFFILIATE_AVANTLINK_API_KEY: z.string().optional(),

  // HubSpot
  HUBSPOT_MODE: z.enum(["mock", "live"]).default("mock"),
  HUBSPOT_API_KEY: z.string().optional(),
  HUBSPOT_INVITE_TEMPLATE_ID: z.string().optional(),
  HUBSPOT_PITCH_TEMPLATE_ID: z.string().optional(),

  // Public feedback links
  FEEDBACK_LINK_BASE_URL: z.url().optional(),
  FEEDBACK_LINK_DEFAULT_EXPIRY_DAYS: z.coerce.number().int().positive().default(30),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration. Check your .env file against .env.example:\n${issues}`,
    );
  }

  return parsed.data;
}

export const env = loadEnv();
