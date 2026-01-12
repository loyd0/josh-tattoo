import { z } from "zod";

export const AllowedContentTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const SubmissionBlobSchema = z.object({
  url: z.string().url(),
  pathname: z.string().min(1),
  contentType: z.enum(AllowedContentTypes),
  size: z.number().int().nonnegative().max(MAX_UPLOAD_BYTES),
});

export const SubmissionRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  bodyArea: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(5000).optional().or(z.literal("")),

  blob: SubmissionBlobSchema,

  // Abuse prevention
  honeypot: z.string().optional(),
  startedAtMs: z.number().int().nonnegative().optional(),

  // Turnstile
  turnstileToken: z.string().min(1),
});

export type SubmissionRequest = z.infer<typeof SubmissionRequestSchema>;

