import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { Course, Lesson, CourseRudiment, PatternCell } from "@/types/curriculum";

const COURSES = "courses";
const LESSONS = "lessons";
const RUDIMENTS_SUB = "rudiments";
const PATTERN_LENGTH = 32;

function normalizePattern(raw: unknown[]): PatternCell[] {
  const out: PatternCell[] = [];
  for (let i = 0; i < PATTERN_LENGTH; i++) {
    const c = raw[i];
    out.push(c === "L" || c === "R" ? c : "");
  }
  return out;
}

export async function getCourses(): Promise<Course[]> {
  const db = getFirebaseDb();
  const ref = collection(db, COURSES);
  const q = query(ref, orderBy("order"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title ?? "",
      description: data.description ?? "",
      order: typeof data.order === "number" ? data.order : 0,
      updatedAt: data.updatedAt ?? "",
    };
  });
}

export async function getCourseById(courseId: string): Promise<Course | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, COURSES, courseId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    title: data.title ?? "",
    description: data.description ?? "",
    order: typeof data.order === "number" ? data.order : 0,
    updatedAt: data.updatedAt ?? "",
  };
}

export async function getLessonsByCourseId(courseId: string): Promise<Lesson[]> {
  const db = getFirebaseDb();
  const ref = collection(db, LESSONS);
  const q = query(ref, where("courseId", "==", courseId), orderBy("order"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const rudimentIds = Array.isArray(data.rudimentIds)
      ? data.rudimentIds
      : data.rudimentId != null
        ? [data.rudimentId]
        : [];
    return {
      id: d.id,
      courseId: data.courseId ?? courseId,
      title: data.title ?? "",
      body: data.body ?? "",
      order: typeof data.order === "number" ? data.order : 0,
      rudimentIds,
      suggestedBpm: data.suggestedBpm,
      updatedAt: data.updatedAt ?? "",
    };
  });
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, LESSONS, lessonId));
  if (!snap.exists()) return null;
  const data = snap.data();
  const rudimentIds = Array.isArray(data.rudimentIds)
    ? data.rudimentIds
    : data.rudimentId != null
      ? [data.rudimentId]
      : [];
  return {
    id: snap.id,
    courseId: data.courseId ?? "",
    title: data.title ?? "",
    body: data.body ?? "",
    order: typeof data.order === "number" ? data.order : 0,
    rudimentIds,
    suggestedBpm: data.suggestedBpm,
    updatedAt: data.updatedAt ?? "",
  };
}

const now = () => new Date().toISOString();

export async function createCourse(data: Omit<Course, "id" | "updatedAt">): Promise<string> {
  const db = getFirebaseDb();
  const ref = collection(db, COURSES);
  const docRef = await addDoc(ref, {
    title: data.title,
    description: data.description,
    order: data.order,
    updatedAt: now(),
  });
  return docRef.id;
}

export async function updateCourse(courseId: string, data: Partial<Omit<Course, "id">>): Promise<void> {
  const db = getFirebaseDb();
  await setDoc(
    doc(db, COURSES, courseId),
    { ...data, updatedAt: now() },
    { merge: true }
  );
}

export async function deleteCourse(courseId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, COURSES, courseId));
}

// --- Course rudiments (subcollection) ---

export async function getCourseRudiments(courseId: string): Promise<CourseRudiment[]> {
  const db = getFirebaseDb();
  const ref = collection(db, COURSES, courseId, RUDIMENTS_SUB);
  const q = query(ref, orderBy("order"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    const raw = Array.isArray(data.pattern) ? data.pattern : [];
    return {
      id: d.id,
      name: data.name ?? "",
      pattern: normalizePattern(raw),
      order: typeof data.order === "number" ? data.order : 0,
      updatedAt: data.updatedAt ?? "",
    };
  });
}

export async function getCourseRudimentById(courseId: string, rudimentId: string): Promise<CourseRudiment | null> {
  const db = getFirebaseDb();
  const snap = await getDoc(doc(db, COURSES, courseId, RUDIMENTS_SUB, rudimentId));
  if (!snap.exists()) return null;
  const data = snap.data();
  const raw = Array.isArray(data.pattern) ? data.pattern : [];
  return {
    id: snap.id,
    name: data.name ?? "",
    pattern: normalizePattern(raw),
    order: typeof data.order === "number" ? data.order : 0,
    updatedAt: data.updatedAt ?? "",
  };
}

export async function createCourseRudiment(
  courseId: string,
  data: Omit<CourseRudiment, "id" | "updatedAt">
): Promise<string> {
  const db = getFirebaseDb();
  const ref = collection(db, COURSES, courseId, RUDIMENTS_SUB);
  const docRef = await addDoc(ref, {
    name: data.name,
    pattern: data.pattern.slice(0, PATTERN_LENGTH),
    order: data.order,
    updatedAt: now(),
  });
  return docRef.id;
}

export async function updateCourseRudiment(
  courseId: string,
  rudimentId: string,
  data: Partial<Omit<CourseRudiment, "id">>
): Promise<void> {
  const db = getFirebaseDb();
  const payload: Record<string, unknown> = { ...data, updatedAt: now() };
  if (data.pattern) payload.pattern = data.pattern.slice(0, PATTERN_LENGTH);
  await setDoc(doc(db, COURSES, courseId, RUDIMENTS_SUB, rudimentId), payload, { merge: true });
}

export async function deleteCourseRudiment(courseId: string, rudimentId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, COURSES, courseId, RUDIMENTS_SUB, rudimentId));
}

export async function createLesson(data: Omit<Lesson, "id" | "updatedAt">): Promise<string> {
  const db = getFirebaseDb();
  const ref = collection(db, LESSONS);
  const docRef = await addDoc(ref, {
    courseId: data.courseId,
    title: data.title,
    body: data.body,
    order: data.order,
    rudimentIds: data.rudimentIds ?? [],
    ...(data.suggestedBpm != null && { suggestedBpm: data.suggestedBpm }),
    updatedAt: now(),
  });
  return docRef.id;
}

export async function updateLesson(lessonId: string, data: Partial<Omit<Lesson, "id" | "courseId">>): Promise<void> {
  const db = getFirebaseDb();
  const payload: Record<string, unknown> = {
    ...data,
    rudimentIds: data.rudimentIds ?? [],
    updatedAt: now(),
  };
  if (data.suggestedBpm === undefined) delete payload.suggestedBpm;
  await setDoc(doc(db, LESSONS, lessonId), payload, { merge: true });
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, LESSONS, lessonId));
}

/** All selectable rudiments for lessons (must match rhythm-app lib/rudiments). */
export const RUDIMENT_OPTIONS = [
  { value: "paradiddle-1", label: "Paradiddle" },
];
