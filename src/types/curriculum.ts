export interface Course {
  id: string;
  title: string;
  description: string;
  order: number;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  body: string;
  order: number;
  /** Rudiment IDs for the student to learn in this lesson. */
  rudimentIds: string[];
  suggestedBpm?: number;
  updatedAt: string;
}

/** One cell in a 32-note pattern: L, R, or rest (empty string). */
export type PatternCell = "L" | "R" | "";

/** Rudiment defined per course (32 sixteenth-note cells). */
export interface CourseRudiment {
  id: string;
  name: string;
  pattern: PatternCell[];
  order: number;
  updatedAt: string;
}
