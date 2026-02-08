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
  rudimentId?: string;
  suggestedBpm?: number;
  updatedAt: string;
}
