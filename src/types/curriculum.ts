export interface Course {
  id: string;
  title: string;
  description: string;
  order: number;
  updatedAt: string;
}

/** One cell in a 32-note pattern: L, R, or rest (empty string). */
export type PatternCell = "L" | "R" | "";

/** Subdivision for rudiment pattern: sixteenth (32 cells) or eighthTriplet (24 cells = 2 bars). */
export type RudimentSubdivision = "sixteenth" | "eighthTriplet";

/** Rudiment defined per course. */
export interface CourseRudiment {
  id: string;
  name: string;
  pattern: PatternCell[];
  subdivision: RudimentSubdivision;
  order: number;
  updatedAt: string;
}
