import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().trim().min(1, "Client name is required").max(200),
  contactName: z.string().trim().max(200).optional().or(z.literal("")),
  contactEmail: z.email("Enter a valid email").optional().or(z.literal("")),
  standingContentGuidelines: z.string().trim().max(5000).optional().or(z.literal("")),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
