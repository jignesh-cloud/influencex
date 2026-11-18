import { z } from "zod";

export const createAffiliateProgramSchema = z.object({
  clientId: z.string().min(1, "Select a client"),
  network: z.enum(["impact", "awin", "avantlink"]),
  programName: z.string().trim().min(1, "Program name is required").max(200),
  externalProgramId: z.string().trim().max(200).optional().or(z.literal("")),
  apiCredential: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CreateAffiliateProgramInput = z.infer<typeof createAffiliateProgramSchema>;
