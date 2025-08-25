import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
  autoComplete: boolean;
  favoriteSubjects: string[];
  recentCategories: string[];
}

export interface LearningProgress {
  totalQuestions: number;
  subjectProgress: Record<string, {
    questionsAsked: number;
    timeSpent: number; // in minutes
    topics: string[];
    lastActivity: Date;
  }>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'questions' | 'time' | 'subjects' | 'streak';
}

export interface Bookmark {
  id: string;
  messageId: string;
  content: string;
  subject: string;
  category: string;
  tags: string[];
  createdAt: Date;
  note?: string;
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  subject: string;
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface UserStore {
  preferences: UserPreferences;
  progress: LearningProgress;
  achievements: Achievement[];
  bookmarks: Bookmark[];
  notes: UserNote[];
  
  // Actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  addToFavorites: (subjectId: string) => void;
  removeFromFavorites: (subjectId: string) => void;
  addRecentCategory: (categoryId: string) => void;
  updateProgress: (subject: string, category: string) => void;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  removeBookmark: (bookmarkId: string) => void;
  addNote: (note: Omit<UserNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (noteId: string, updates: Partial<Omit<UserNote, 'id' | 'createdAt'>>) => void;
  deleteNote: (noteId: string) => void;
  unlockAchievement: (achievement: Omit<Achievement, 'id' | 'unlockedAt'>) => void;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  autoComplete: true,
  favoriteSubjects: [],
  recentCategories: [],
};

const defaultProgress: LearningProgress = {
  totalQuestions: 0,
  subjectProgress: {},
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      progress: defaultProgress,
      achievements: [],
      bookmarks: [],
      notes: [],

      updatePreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),

      addToFavorites: (subjectId) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            favoriteSubjects: Array.from(new Set([...state.preferences.favoriteSubjects, subjectId])),
          },
        })),

      removeFromFavorites: (subjectId) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            favoriteSubjects: state.preferences.favoriteSubjects.filter(id => id !== subjectId),
          },
        })),

      addRecentCategory: (categoryId) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            recentCategories: [
              categoryId,
              ...state.preferences.recentCategories.filter(id => id !== categoryId),
            ].slice(0, 10),
          },
        })),

      updateProgress: (subject, category) =>
        set((state) => {
          const currentProgress = state.progress.subjectProgress[subject] || {
            questionsAsked: 0,
            timeSpent: 0,
            topics: [],
            lastActivity: new Date(),
          };

          return {
            progress: {
              ...state.progress,
              totalQuestions: state.progress.totalQuestions + 1,
              subjectProgress: {
                ...state.progress.subjectProgress,
                [subject]: {
                  ...currentProgress,
                  questionsAsked: currentProgress.questionsAsked + 1,
                  topics: Array.from(new Set([...currentProgress.topics, category])),
                  lastActivity: new Date(),
                },
              },
            },
          };
        }),

      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [
            ...state.bookmarks,
            {
              ...bookmark,
              id: `bookmark-${Date.now()}`,
              createdAt: new Date(),
            },
          ],
        })),

      removeBookmark: (bookmarkId) =>
        set((state) => ({
          bookmarks: state.bookmarks.filter(b => b.id !== bookmarkId),
        })),

      addNote: (note) =>
        set((state) => ({
          notes: [
            ...state.notes,
            {
              ...note,
              id: `note-${Date.now()}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      updateNote: (noteId, updates) =>
        set((state) => ({
          notes: state.notes.map(note =>
            note.id === noteId
              ? { ...note, ...updates, updatedAt: new Date() }
              : note
          ),
        })),

      deleteNote: (noteId) =>
        set((state) => ({
          notes: state.notes.filter(note => note.id !== noteId),
        })),

      unlockAchievement: (achievement) =>
        set((state) => {
          const exists = state.achievements.some(a => a.title === achievement.title);
          if (exists) return state;

          return {
            achievements: [
              ...state.achievements,
              {
                ...achievement,
                id: `achievement-${Date.now()}`,
                unlockedAt: new Date(),
              },
            ],
          };
        }),
    }),
    {
      name: 'studyai-user-store',
      partialize: (state) => ({
        preferences: state.preferences,
        progress: state.progress,
        achievements: state.achievements,
        bookmarks: state.bookmarks,
        notes: state.notes,
      }),
    }
  )
);