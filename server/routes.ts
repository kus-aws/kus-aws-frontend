import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { insertUserSchema, chatRequestSchema, feedbackRequestSchema } from "@shared/schema";
import { storage } from "./storage";
import { majorCategories } from "../client/src/data/categories";

// Simulate AI response generation
function generateAIResponse(message: string, majorCategory: string, subCategory: string): string {
  const responses = [
    `${message}에 대한 질문이네요! 이는 ${subCategory} 분야에서 중요한 개념입니다. 자세히 설명드리겠습니다.`,
    `좋은 질문입니다. ${subCategory}에서 이 개념을 이해하려면 먼저 기본 원리부터 살펴보겠습니다.`,
    `${majorCategory} 전공에서 자주 다루는 주제네요. 단계별로 설명드리겠습니다.`,
    `흥미로운 질문이에요! 이 내용은 실제 ${majorCategory} 현장에서도 매우 중요합니다.`,
    `${message}와 관련된 핵심 개념들을 차근차근 설명해드리겠습니다.`,
  ];
  
  const baseResponse = responses[Math.floor(Math.random() * responses.length)];
  const additionalInfo = ` 더 자세한 설명이 필요하시거나 관련된 다른 질문이 있으시면 언제든 말씀해주세요!`;
  
  return baseResponse + additionalInfo;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", (req, res) => {
    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };
    res.json(healthData);
  });

  // Get subjects (major categories)
  app.get("/api/subjects", (req, res) => {
    try {
      res.json(majorCategories);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subjects" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const startTime = Date.now();
      const chatData = chatRequestSchema.parse(req.body);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      
      const aiResponse = generateAIResponse(
        chatData.message,
        chatData.majorCategory,
        chatData.subCategory
      );
      
      const processingTime = Date.now() - startTime;
      
      const response = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        timestamp: new Date().toISOString(),
        sessionId: chatData.sessionId || `session-${Date.now()}`,
        processingTime,
      };
      
      res.json(response);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid chat data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process chat request" });
      }
    }
  });

  // Feedback endpoint
  app.post("/api/feedback", async (req, res) => {
    try {
      const feedbackData = feedbackRequestSchema.parse(req.body);
      // In a real app, you would store this feedback in the database
      console.log(`Feedback received for message ${feedbackData.messageId}: ${feedbackData.feedback}`);
      res.json({ success: true, message: "Feedback recorded" });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid feedback data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to record feedback" });
      }
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ id: user.id, username: user.username });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}