import { z } from "zod";

export const createContentGuidelineTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required").max(200),
  clientId: z.string().optional().or(z.literal("")),
  rules: z.string().trim().min(1, "Add at least one rule"),
});

export type CreateContentGuidelineTemplateInput = z.infer<typeof createContentGuidelineTemplateSchema>;
