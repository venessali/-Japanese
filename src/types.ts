export type VocabTag = 'mastered' | 'review' | 'learning';

export interface Vocabulary {
  id: string;
  word: string;
  reading: string;
  pitchAccent?: string;
  meaning: string;
  tag: VocabTag;
  sourceUrl?: string;
  createdAt: number;
  lastReviewed: number;
  uid?: string;
  notes?: string;
}

export interface Grammar {
  id: string;
  pattern: string;
  meaning: string;
  example: string;
  sourceUrl?: string;
  createdAt: number;
  uid?: string;
  notes?: string;
}

export interface LearningLog {
  date: string; // YYYY-MM-DD
  vocabLearned: number;
  grammarLearned: number;
  quizzesTaken: number;
}
