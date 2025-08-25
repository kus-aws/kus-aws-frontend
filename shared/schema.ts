import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Chat related tables
export const chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  majorCategory: text("major_category").notNull(),
  subCategory: text("sub_category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id).notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'user' | 'ai' | 'system'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  userId: true,
  majorCategory: true,
  subCategory: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  content: true,
  sender: true,
});

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// API request/response schemas
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

// Frontend-only types for UI state management
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

export const chatStateSchema = z.object({
  selectedMajor: z.string().optional(),
  selectedSub: z.string().optional(),
  messages: z.array(z.object({
    id: z.string(),
    content: z.string(),
    sender: z.enum(["user", "ai", "system"]),
    timestamp: z.date(),
  })),
  isLoading: z.boolean(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type MajorCategory = z.infer<typeof majorCategoriesSchema>;
export type ChatState = z.infer<typeof chatStateSchema>;
export type MessageSender = "user" | "ai" | "system";

// Enhanced message interface with feedback
export const enhancedMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  sender: z.enum(["user", "ai", "system"]),
  timestamp: z.date(),
  feedback: z.enum(["like", "dislike"]).optional(),
  processingTime: z.number().optional(),
});

export type EnhancedMessage = z.infer<typeof enhancedMessageSchema>;
