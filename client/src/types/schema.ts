// src/types/schema.ts

export interface MajorCategory {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  description?: string;
  sampleQuestions?: string[];
}

export interface CategoryData {
  majorCategories: MajorCategory[];
}
