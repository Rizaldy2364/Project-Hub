import { z } from "zod";

export const notificationTabSchema = z.enum([
  "all",
  "unread",
  "mention",
  "task",
  "invite",
]);

export const notificationCursorSchema = z.object({
  tab: notificationTabSchema.default("all"),
  cursor: z.string().cuid().nullish(),
});

export type NotificationTabInput = z.infer<typeof notificationTabSchema>;
