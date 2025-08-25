// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { z as z2 } from "zod";

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var chatSessions = pgTable("chat_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  majorCategory: text("major_category").notNull(),
  subCategory: text("sub_category"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").references(() => chatSessions.id).notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(),
  // 'user' | 'ai' | 'system'
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var insertChatSessionSchema = createInsertSchema(chatSessions).pick({
  userId: true,
  majorCategory: true,
  subCategory: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  content: true,
  sender: true
});
var chatRequestSchema = z.object({
  message: z.string().min(1),
  majorCategory: z.string(),
  subCategory: z.string(),
  sessionId: z.string().optional()
});
var chatResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  timestamp: z.string(),
  sessionId: z.string(),
  processingTime: z.number()
});
var feedbackRequestSchema = z.object({
  messageId: z.string(),
  feedback: z.enum(["like", "dislike"])
});
var healthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
  version: z.string()
});
var majorCategoriesSchema = z.object({
  id: z.string(),
  emoji: z.string(),
  name: z.string(),
  description: z.string(),
  subCategories: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    sampleQuestions: z.array(z.string())
  }))
});
var chatStateSchema = z.object({
  selectedMajor: z.string().optional(),
  selectedSub: z.string().optional(),
  messages: z.array(z.object({
    id: z.string(),
    content: z.string(),
    sender: z.enum(["user", "ai", "system"]),
    timestamp: z.date()
  })),
  isLoading: z.boolean()
});
var enhancedMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  sender: z.enum(["user", "ai", "system"]),
  timestamp: z.date(),
  feedback: z.enum(["like", "dislike"]).optional(),
  processingTime: z.number().optional()
});

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  users;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
};
var storage = new MemStorage();

// client/src/data/categories.ts
var majorCategories = [
  {
    id: "computer-science",
    emoji: "\u{1F4BB}",
    name: "\uCEF4\uD4E8\uD130\uACF5\uD559",
    description: "\uD504\uB85C\uADF8\uB798\uBC0D, \uC54C\uACE0\uB9AC\uC998, \uB370\uC774\uD130\uAD6C\uC870",
    subCategories: [
      {
        id: "programming",
        name: "\uD504\uB85C\uADF8\uB798\uBC0D",
        description: "\uAC01\uC885 \uD504\uB85C\uADF8\uB798\uBC0D \uC5B8\uC5B4\uC640 \uAC1C\uBC1C \uAE30\uBC95",
        sampleQuestions: [
          "Python\uC5D0\uC11C \uB9AC\uC2A4\uD2B8\uC640 \uD29C\uD50C\uC758 \uCC28\uC774\uC810\uC740?",
          "\uC7AC\uADC0\uD568\uC218\uC758 \uC791\uB3D9\uC6D0\uB9AC\uB97C \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uAC1D\uCCB4\uC9C0\uD5A5 \uD504\uB85C\uADF8\uB798\uBC0D\uC758 4\uB300 \uD2B9\uC9D5\uC740?"
        ]
      },
      {
        id: "algorithms",
        name: "\uC54C\uACE0\uB9AC\uC998",
        description: "\uC790\uB8CC\uAD6C\uC870\uC640 \uC54C\uACE0\uB9AC\uC998 \uBB38\uC81C \uD574\uACB0",
        sampleQuestions: [
          "\uBC84\uBE14\uC815\uB82C\uC758 \uC2DC\uAC04\uBCF5\uC7A1\uB3C4\uB294?",
          "\uC774\uC9C4\uD0D0\uC0C9\uD2B8\uB9AC\uC758 \uD2B9\uC9D5\uC744 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uB3D9\uC801\uACC4\uD68D\uBC95\uC774 \uBB34\uC5C7\uC778\uC9C0 \uC54C\uB824\uC8FC\uC138\uC694"
        ]
      },
      {
        id: "database",
        name: "\uB370\uC774\uD130\uBCA0\uC774\uC2A4",
        description: "\uB370\uC774\uD130\uBCA0\uC774\uC2A4 \uC124\uACC4\uC640 SQL",
        sampleQuestions: [
          "\uC815\uADDC\uD654\uAC00 \uBB34\uC5C7\uC778\uC9C0 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "JOIN\uC758 \uC885\uB958\uC640 \uCC28\uC774\uC810\uC740?",
          "\uC778\uB371\uC2A4\uC758 \uC5ED\uD560\uACFC \uC7A5\uB2E8\uC810\uC740?"
        ]
      },
      {
        id: "network",
        name: "\uB124\uD2B8\uC6CC\uD06C",
        description: "\uCEF4\uD4E8\uD130 \uB124\uD2B8\uC6CC\uD06C\uC640 \uD1B5\uC2E0",
        sampleQuestions: [
          "OSI 7\uACC4\uCE35 \uBAA8\uB378\uC744 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "TCP\uC640 UDP\uC758 \uCC28\uC774\uC810\uC740?",
          "HTTP\uC640 HTTPS\uC758 \uCC28\uC774\uC810\uC740?"
        ]
      }
    ]
  },
  {
    id: "mathematics",
    emoji: "\u{1F4D0}",
    name: "\uC218\uD559",
    description: "\uBBF8\uC801\uBD84, \uC120\uD615\uB300\uC218, \uD1B5\uACC4\uD559",
    subCategories: [
      {
        id: "calculus",
        name: "\uBBF8\uC801\uBD84\uD559",
        description: "\uADF9\uD55C, \uBBF8\uBD84, \uC801\uBD84",
        sampleQuestions: [
          "\uBBF8\uBD84\uC758 \uAE30\uBCF8 \uACF5\uC2DD\uB4E4\uC744 \uC54C\uB824\uC8FC\uC138\uC694",
          "\uC801\uBD84\uC758 \uAE30\uD558\uD559\uC801 \uC758\uBBF8\uB294?",
          "\uC5F0\uC1C4\uBC95\uCE59\uC774 \uBB34\uC5C7\uC778\uC9C0 \uC124\uBA85\uD574\uC8FC\uC138\uC694"
        ]
      },
      {
        id: "linear-algebra",
        name: "\uC120\uD615\uB300\uC218",
        description: "\uBCA1\uD130, \uD589\uB82C, \uACE0\uC720\uAC12",
        sampleQuestions: [
          "\uD589\uB82C\uC758 \uACF1\uC148 \uBC29\uBC95\uC744 \uC54C\uB824\uC8FC\uC138\uC694",
          "\uACE0\uC720\uAC12\uACFC \uACE0\uC720\uBCA1\uD130\uB780?",
          "\uBCA1\uD130\uC758 \uB0B4\uC801\uACFC \uC678\uC801\uC758 \uCC28\uC774\uB294?"
        ]
      },
      {
        id: "statistics",
        name: "\uD1B5\uACC4\uD559",
        description: "\uD655\uB960, \uBD84\uD3EC, \uCD94\uB860",
        sampleQuestions: [
          "\uC911\uC2EC\uADF9\uD55C\uC815\uB9AC\uB97C \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uC2E0\uB8B0\uAD6C\uAC04\uC774 \uBB34\uC5C7\uC778\uC9C0 \uC54C\uB824\uC8FC\uC138\uC694",
          "\uC815\uADDC\uBD84\uD3EC\uC758 \uD2B9\uC9D5\uC740?"
        ]
      }
    ]
  },
  {
    id: "economics",
    emoji: "\u{1F4C8}",
    name: "\uACBD\uC81C\uD559",
    description: "\uBBF8\uC2DC\uACBD\uC81C, \uAC70\uC2DC\uACBD\uC81C, \uACC4\uB7C9\uACBD\uC81C",
    subCategories: [
      {
        id: "microeconomics",
        name: "\uBBF8\uC2DC\uACBD\uC81C\uD559",
        description: "\uAC1C\uBCC4 \uACBD\uC81C\uC8FC\uCCB4\uC758 \uD589\uB3D9",
        sampleQuestions: [
          "\uC218\uC694\uC758 \uBC95\uCE59\uC774 \uBB34\uC5C7\uC778\uC9C0 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uD0C4\uB825\uC131\uC758 \uAC1C\uB150\uC744 \uC54C\uB824\uC8FC\uC138\uC694",
          "\uC644\uC804\uACBD\uC7C1\uC2DC\uC7A5\uC758 \uD2B9\uC9D5\uC740?"
        ]
      },
      {
        id: "macroeconomics",
        name: "\uAC70\uC2DC\uACBD\uC81C\uD559",
        description: "\uAD6D\uAC00 \uC804\uCCB4\uC758 \uACBD\uC81C \uD604\uC0C1",
        sampleQuestions: [
          "GDP\uAC00 \uBB34\uC5C7\uC778\uC9C0 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uC778\uD50C\uB808\uC774\uC158\uC758 \uC6D0\uC778\uC740?",
          "\uD1B5\uD654\uC815\uCC45\uACFC \uC7AC\uC815\uC815\uCC45\uC758 \uCC28\uC774\uB294?"
        ]
      },
      {
        id: "econometrics",
        name: "\uACC4\uB7C9\uACBD\uC81C\uD559",
        description: "\uACBD\uC81C \uD604\uC0C1\uC758 \uD1B5\uACC4\uC801 \uBD84\uC11D",
        sampleQuestions: [
          "\uD68C\uADC0\uBD84\uC11D\uC774 \uBB34\uC5C7\uC778\uC9C0 \uC54C\uB824\uC8FC\uC138\uC694",
          "\uB2E4\uC911\uACF5\uC120\uC131 \uBB38\uC81C\uB780?",
          "\uC2DC\uACC4\uC5F4 \uB370\uC774\uD130\uC758 \uD2B9\uC9D5\uC740?"
        ]
      }
    ]
  },
  {
    id: "physics",
    emoji: "\u269B\uFE0F",
    name: "\uBB3C\uB9AC\uD559",
    description: "\uC5ED\uD559, \uC804\uC790\uAE30\uD559, \uC591\uC790\uBB3C\uB9AC",
    subCategories: [
      {
        id: "mechanics",
        name: "\uC5ED\uD559",
        description: "\uC6B4\uB3D9\uACFC \uD798\uC758 \uBC95\uCE59",
        sampleQuestions: [
          "\uB274\uD134\uC758 \uC81C1\uBC95\uCE59\uC744 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uC6B4\uB3D9\uB7C9 \uBCF4\uC874 \uBC95\uCE59\uC774\uB780?",
          "\uB4F1\uC18D\uC6D0\uC6B4\uB3D9\uC758 \uD2B9\uC9D5\uC740?"
        ]
      },
      {
        id: "electromagnetics",
        name: "\uC804\uC790\uAE30\uD559",
        description: "\uC804\uAE30\uC640 \uC790\uAE30 \uD604\uC0C1",
        sampleQuestions: [
          "\uCFE8\uB871\uC758 \uBC95\uCE59\uC744 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uC804\uAE30\uC7A5\uACFC \uC790\uAE30\uC7A5\uC758 \uCC28\uC774\uB294?",
          "\uD328\uB7EC\uB370\uC774 \uBC95\uCE59\uC774 \uBB34\uC5C7\uC778\uC9C0 \uC54C\uB824\uC8FC\uC138\uC694"
        ]
      },
      {
        id: "quantum",
        name: "\uC591\uC790\uBB3C\uB9AC",
        description: "\uBBF8\uC2DC\uC138\uACC4\uC758 \uBB3C\uB9AC \uD604\uC0C1",
        sampleQuestions: [
          "\uD50C\uB791\uD06C \uC0C1\uC218\uC758 \uC758\uBBF8\uB294?",
          "\uBD88\uD655\uC815\uC131 \uC6D0\uB9AC\uB97C \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uD30C\uB3D9-\uC785\uC790 \uC774\uC911\uC131\uC774\uB780?"
        ]
      }
    ]
  },
  {
    id: "chemistry",
    emoji: "\u{1F9EA}",
    name: "\uD654\uD559",
    description: "\uC720\uAE30\uD654\uD559, \uBB34\uAE30\uD654\uD559, \uBD84\uC11D\uD654\uD559",
    subCategories: [
      {
        id: "organic",
        name: "\uC720\uAE30\uD654\uD559",
        description: "\uD0C4\uC18C \uD654\uD569\uBB3C\uC758 \uD654\uD559",
        sampleQuestions: [
          "\uC791\uC6A9\uAE30\uAC00 \uBB34\uC5C7\uC778\uC9C0 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uC774\uC131\uC9C8\uCCB4\uC758 \uC885\uB958\uB294?",
          "\uCE58\uD658\uBC18\uC751\uACFC \uCCA8\uAC00\uBC18\uC751\uC758 \uCC28\uC774\uB294?"
        ]
      },
      {
        id: "inorganic",
        name: "\uBB34\uAE30\uD654\uD559",
        description: "\uBB34\uAE30 \uD654\uD569\uBB3C\uC758 \uD654\uD559",
        sampleQuestions: [
          "\uC8FC\uAE30\uC728\uD45C\uC758 \uC8FC\uAE30\uC131\uC744 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uC774\uC628\uACB0\uD569\uACFC \uACF5\uC720\uACB0\uD569\uC758 \uCC28\uC774\uB294?",
          "\uC0B0\uD654-\uD658\uC6D0 \uBC18\uC751\uC774\uB780?"
        ]
      },
      {
        id: "analytical",
        name: "\uBD84\uC11D\uD654\uD559",
        description: "\uBB3C\uC9C8\uC758 \uC815\uC131\xB7\uC815\uB7C9 \uBD84\uC11D",
        sampleQuestions: [
          "\uD06C\uB85C\uB9C8\uD1A0\uADF8\uB798\uD53C\uC758 \uC6D0\uB9AC\uB294?",
          "\uC801\uC815\uC758 \uC885\uB958\uB97C \uC54C\uB824\uC8FC\uC138\uC694",
          "\uBD84\uAD11\uBC95\uC758 \uAE30\uBCF8 \uC6D0\uB9AC\uB294?"
        ]
      }
    ]
  },
  {
    id: "biology",
    emoji: "\u{1F9EC}",
    name: "\uC0DD\uBB3C\uD559",
    description: "\uBD84\uC790\uC0DD\uBB3C\uD559, \uC720\uC804\uD559, \uC0DD\uD0DC\uD559",
    subCategories: [
      {
        id: "molecular",
        name: "\uBD84\uC790\uC0DD\uBB3C\uD559",
        description: "\uC138\uD3EC\uC640 \uBD84\uC790 \uC218\uC900\uC758 \uC0DD\uBA85\uD604\uC0C1",
        sampleQuestions: [
          "DNA \uBCF5\uC81C \uACFC\uC815\uC744 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uB2E8\uBC31\uC9C8 \uD569\uC131 \uACFC\uC815\uC740?",
          "\uD6A8\uC18C\uC758 \uC791\uC6A9 \uC6D0\uB9AC\uB97C \uC54C\uB824\uC8FC\uC138\uC694"
        ]
      },
      {
        id: "genetics",
        name: "\uC720\uC804\uD559",
        description: "\uC720\uC804 \uD604\uC0C1\uACFC \uC720\uC804\uC790",
        sampleQuestions: [
          "\uBA58\uB378\uC758 \uBC95\uCE59\uC744 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uB3CC\uC5F0\uBCC0\uC774\uC758 \uC885\uB958\uB294?",
          "\uC720\uC804\uC790 \uBC1C\uD604 \uC870\uC808\uC774\uB780?"
        ]
      },
      {
        id: "ecology",
        name: "\uC0DD\uD0DC\uD559",
        description: "\uC0DD\uBB3C\uACFC \uD658\uACBD\uC758 \uC0C1\uD638\uC791\uC6A9",
        sampleQuestions: [
          "\uC0DD\uD0DC\uACC4\uC758 \uAD6C\uC131\uC694\uC18C\uB294?",
          "\uBA39\uC774\uC0AC\uC2AC\uACFC \uBA39\uC774\uADF8\uBB3C\uC758 \uCC28\uC774\uB294?",
          "\uC0DD\uBB3C\uB2E4\uC591\uC131\uC774 \uC911\uC694\uD55C \uC774\uC720\uB294?"
        ]
      }
    ]
  },
  {
    id: "literature",
    emoji: "\u{1F4DA}",
    name: "\uBB38\uD559",
    description: "\uD604\uB300\uBB38\uD559, \uACE0\uC804\uBB38\uD559, \uBE44\uD3C9\uC774\uB860",
    subCategories: [
      {
        id: "modern",
        name: "\uD604\uB300\uBB38\uD559",
        description: "20\uC138\uAE30 \uC774\uD6C4\uC758 \uBB38\uD559",
        sampleQuestions: [
          "\uBAA8\uB354\uB2C8\uC998 \uBB38\uD559\uC758 \uD2B9\uC9D5\uC740?",
          "\uC758\uC2DD\uC758 \uD750\uB984 \uAE30\uBC95\uC774\uB780?",
          "\uD3EC\uC2A4\uD2B8\uBAA8\uB354\uB2C8\uC998\uACFC \uBAA8\uB354\uB2C8\uC998\uC758 \uCC28\uC774\uB294?"
        ]
      },
      {
        id: "classical",
        name: "\uACE0\uC804\uBB38\uD559",
        description: "\uC804\uD1B5 \uBB38\uD559\uACFC \uACE0\uC804 \uC791\uD488",
        sampleQuestions: [
          "\uD310\uC18C\uB9AC\uC758 \uD2B9\uC9D5\uC744 \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uD55C\uC2DC\uC758 \uD615\uC2DD\uACFC \uD2B9\uC9D5\uC740?",
          "\uACE0\uC804\uC18C\uC124\uC758 \uC8FC\uC694 \uAC08\uB798\uB294?"
        ]
      },
      {
        id: "theory",
        name: "\uBB38\uD559\uC774\uB860",
        description: "\uBB38\uD559 \uBE44\uD3C9\uACFC \uC774\uB860",
        sampleQuestions: [
          "\uD615\uC2DD\uC8FC\uC758 \uBE44\uD3C9\uC774\uB780?",
          "\uC2E0\uBE44\uD3C9\uC758 \uD2B9\uC9D5\uC744 \uC54C\uB824\uC8FC\uC138\uC694",
          "\uD574\uCCB4\uC8FC\uC758 \uBE44\uD3C9\uC758 \uD575\uC2EC\uC740?"
        ]
      }
    ]
  },
  {
    id: "history",
    emoji: "\u{1F4DC}",
    name: "\uC5ED\uC0AC",
    description: "\uD55C\uAD6D\uC0AC, \uC138\uACC4\uC0AC, \uBB38\uD654\uC0AC",
    subCategories: [
      {
        id: "korean",
        name: "\uD55C\uAD6D\uC0AC",
        description: "\uD55C\uAD6D\uC758 \uC5ED\uC0AC\uC640 \uBB38\uD654",
        sampleQuestions: [
          "\uACE0\uAD6C\uB824\uC758 \uC601\uD1A0 \uD655\uC7A5 \uACFC\uC815\uC740?",
          "\uC870\uC120\uC758 \uACFC\uAC70\uC81C\uB3C4\uB97C \uC124\uBA85\uD574\uC8FC\uC138\uC694",
          "\uC77C\uC81C\uAC15\uC810\uAE30\uC758 \uC800\uD56D\uC6B4\uB3D9\uC740?"
        ]
      },
      {
        id: "world",
        name: "\uC138\uACC4\uC0AC",
        description: "\uC138\uACC4 \uAC01\uAD6D\uC758 \uC5ED\uC0AC",
        sampleQuestions: [
          "\uB974\uB124\uC0C1\uC2A4\uC758 \uD2B9\uC9D5\uC740?",
          "\uC0B0\uC5C5\uD601\uBA85\uC758 \uC601\uD5A5\uC744 \uC54C\uB824\uC8FC\uC138\uC694",
          "\uB450 \uCC28\uB840 \uC138\uACC4\uB300\uC804\uC758 \uC6D0\uC778\uC740?"
        ]
      },
      {
        id: "cultural",
        name: "\uBB38\uD654\uC0AC",
        description: "\uC778\uB958\uC758 \uBB38\uD654\uC640 \uC0AC\uC0C1",
        sampleQuestions: [
          "\uBD88\uAD50 \uC804\uB798\uC758 \uC5ED\uC0AC\uC801 \uC758\uBBF8\uB294?",
          "\uACC4\uBABD\uC0AC\uC0C1\uC758 \uD575\uC2EC \uB0B4\uC6A9\uC740?",
          "\uC885\uAD50\uAC1C\uD601\uC758 \uBC30\uACBD\uACFC \uACB0\uACFC\uB294?"
        ]
      }
    ]
  }
];

// server/routes.ts
function generateAIResponse(message, majorCategory, subCategory) {
  const responses = [
    `${message}\uC5D0 \uB300\uD55C \uC9C8\uBB38\uC774\uB124\uC694! \uC774\uB294 ${subCategory} \uBD84\uC57C\uC5D0\uC11C \uC911\uC694\uD55C \uAC1C\uB150\uC785\uB2C8\uB2E4. \uC790\uC138\uD788 \uC124\uBA85\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.`,
    `\uC88B\uC740 \uC9C8\uBB38\uC785\uB2C8\uB2E4. ${subCategory}\uC5D0\uC11C \uC774 \uAC1C\uB150\uC744 \uC774\uD574\uD558\uB824\uBA74 \uBA3C\uC800 \uAE30\uBCF8 \uC6D0\uB9AC\uBD80\uD130 \uC0B4\uD3B4\uBCF4\uACA0\uC2B5\uB2C8\uB2E4.`,
    `${majorCategory} \uC804\uACF5\uC5D0\uC11C \uC790\uC8FC \uB2E4\uB8E8\uB294 \uC8FC\uC81C\uB124\uC694. \uB2E8\uACC4\uBCC4\uB85C \uC124\uBA85\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.`,
    `\uD765\uBBF8\uB85C\uC6B4 \uC9C8\uBB38\uC774\uC5D0\uC694! \uC774 \uB0B4\uC6A9\uC740 \uC2E4\uC81C ${majorCategory} \uD604\uC7A5\uC5D0\uC11C\uB3C4 \uB9E4\uC6B0 \uC911\uC694\uD569\uB2C8\uB2E4.`,
    `${message}\uC640 \uAD00\uB828\uB41C \uD575\uC2EC \uAC1C\uB150\uB4E4\uC744 \uCC28\uADFC\uCC28\uADFC \uC124\uBA85\uD574\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4.`
  ];
  const baseResponse = responses[Math.floor(Math.random() * responses.length)];
  const additionalInfo = ` \uB354 \uC790\uC138\uD55C \uC124\uBA85\uC774 \uD544\uC694\uD558\uC2DC\uAC70\uB098 \uAD00\uB828\uB41C \uB2E4\uB978 \uC9C8\uBB38\uC774 \uC788\uC73C\uC2DC\uBA74 \uC5B8\uC81C\uB4E0 \uB9D0\uC500\uD574\uC8FC\uC138\uC694!`;
  return baseResponse + additionalInfo;
}
async function registerRoutes(app2) {
  app2.get("/api/health", (req, res) => {
    const healthData = {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0"
    };
    res.json(healthData);
  });
  app2.get("/api/subjects", (req, res) => {
    try {
      res.json(majorCategories);
    } catch (error) {
      res.status(500).json({ error: "Failed to get subjects" });
    }
  });
  app2.post("/api/chat", async (req, res) => {
    try {
      const startTime = Date.now();
      const chatData = chatRequestSchema.parse(req.body);
      await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1200));
      const aiResponse = generateAIResponse(
        chatData.message,
        chatData.majorCategory,
        chatData.subCategory
      );
      const processingTime = Date.now() - startTime;
      const response = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        sessionId: chatData.sessionId || `session-${Date.now()}`,
        processingTime
      };
      res.json(response);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid chat data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to process chat request" });
      }
    }
  });
  app2.post("/api/feedback", async (req, res) => {
    try {
      const feedbackData = feedbackRequestSchema.parse(req.body);
      console.log(`Feedback received for message ${feedbackData.messageId}: ${feedbackData.feedback}`);
      res.json({ success: true, message: "Feedback recorded" });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid feedback data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to record feedback" });
      }
    }
  });
  app2.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        res.status(400).json({ error: "Invalid user data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  define: {
    __dirname: JSON.stringify(import.meta.dirname)
  },
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
