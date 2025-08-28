import { z } from "zod";

// Chat schemas
export const chatRequestSchema = z.object({
  message: z.string().min(1),
  majorCategory: z.string(),
  subCategory: z.string(),
  sessionId: z.string().optional(),
});

export const chatResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  processingTime: z.number(),
});

export const feedbackRequestSchema = z.object({
  messageId: z.string(),
  feedback: z.enum(["like", "dislike"]),
});

export const healthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  version: z.string(),
});

export const majorCategoriesSchema = z.object({
  id: z.string(),
  emoji: z.string(),
  name: z.string(),
  description: z.string(),
  subCategories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    sampleQuestions: z.array(z.string()),
  })),
});

// Types
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type MajorCategory = z.infer<typeof majorCategoriesSchema>;