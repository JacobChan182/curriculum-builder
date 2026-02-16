export interface Course {
  id: string;
  title: string;
  description: string;
  order: number;
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
