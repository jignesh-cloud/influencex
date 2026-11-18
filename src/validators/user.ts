import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  email: z.email("Enter a valid email"),
  role: z.enum(["admin", "team_member"]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
