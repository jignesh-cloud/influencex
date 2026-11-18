import { z } from "zod";

export const submitClientFeedbackSchema = z.object({
  reviewerName: z.string().trim().min(1, "Your name is required").max(200),
  reviewerEmail: z.email("Enter a valid email").optional().or(z.literal("")),
  preference: z.enum(["interested", "pass_for_campaign", "negotiating"]),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type SubmitClientFeedbackInput = z.infer<typeof submitClientFeedbackSchema>;
