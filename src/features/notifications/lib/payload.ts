import { z } from "zod";

export const previewSchema = z.object({
  kind: z.enum(["text", "image", "gif", "video", "voice"]),
  text: z.string(),
  durationSec: z.number().optional(),
});
export const pushPayloadSchema = z.discriminatedUnion("type", [
  z.object({ v: z.literal(1), type: z.literal("message"), conversationId: z.string(), messageId: z.string().optional(), sender: z.object({ id: z.string(), name: z.string() }), preview: previewSchema.optional(), createdAt: z.string() }),
  z.object({ v: z.literal(1), type: z.literal("reaction"), conversationId: z.string(), messageId: z.string().optional(), sender: z.object({ id: z.string(), name: z.string() }), emoji: z.string().optional(), reactedToPreview: previewSchema.optional(), createdAt: z.string() }),
  z.object({ v: z.literal(1), type: z.literal("new-user"), conversationId: z.string().optional(), sender: z.object({ id: z.string(), name: z.string() }), createdAt: z.string() }),
]);
export type PushPayload = z.infer<typeof pushPayloadSchema>;
