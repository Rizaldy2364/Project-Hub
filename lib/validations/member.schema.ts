import { z } from "zod";

export const getMemberProfileSchema = z.object({
  userId: z.string().cuid(),
  projectId: z.string().cuid(),
});

export type GetMemberProfileInput = z.infer<typeof getMemberProfileSchema>;
