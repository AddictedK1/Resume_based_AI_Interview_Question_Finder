import { z } from "zod";

export const createSubmissionSchema = z.object({
  questionText: z.string().trim().min(10, "Question must be at least 10 characters").max(500),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional().default([]),
  company: z.string().trim().max(100).optional().default(""),
  seenInInterview: z.boolean(),
});

export const moderateSubmissionSchema = z.object({
  adminNote: z.string().trim().max(500).optional().default(""),
});

export const createQuestionSchema = z.object({
  questionText: z.string().trim().min(10, "Question must be at least 10 characters").max(500),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional().default([]),
  company: z.string().trim().max(100).optional().default(""),
  seenInInterview: z.boolean(),
});
