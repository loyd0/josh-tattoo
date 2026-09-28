import { z } from "zod";

export const CastVoteSchema = z.object({
  submissionId: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().min(3).max(200),
  fingerprint: z.string().trim().min(16).max(200),
  honeypot: z.string().optional(),
  startedAtMs: z.number().int().nonnegative().optional(),
  turnstileToken: z.string().min(1),
});

export const ResendVoteSchema = z.object({
  email: z.string().trim().min(3).max(200),
  honeypot: z.string().optional(),
  turnstileToken: z.string().min(1),
});

export const ConfirmVoteSchema = z.object({
  token: z.string().trim().min(20).max(200),
});
