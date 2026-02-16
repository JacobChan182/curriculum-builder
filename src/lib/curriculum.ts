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
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { Course, CourseRudiment, PatternCell } from "@/types/curriculum";

const COURSES = "courses";
const RUDIMENTS_SUB = "rudiments";

export const PATTERN_LENGTHS = {
  sixteenth: 32,
  eighthTriplet: 24,
} as const;

function normalizePattern(raw: unknown[], length: number): PatternCell[] {
  const out: PatternCell[] = [];
  for (let i = 0; i < length; i++) {
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
    const sub = data.subdivision === "eighthTriplet" ? "eighthTriplet" : "sixteenth";
    const len = PATTERN_LENGTHS[sub];
    return {
      id: d.id,
      name: data.name ?? "",
      pattern: normalizePattern(raw, len),
      subdivision: sub,
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
  const sub = data.subdivision === "eighthTriplet" ? "eighthTriplet" : "sixteenth";
  const len = PATTERN_LENGTHS[sub];
  return {
    id: snap.id,
    name: data.name ?? "",
    pattern: normalizePattern(raw, len),
    subdivision: sub,
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
  const len = PATTERN_LENGTHS[data.subdivision ?? "sixteenth"];
  const docRef = await addDoc(ref, {
    name: data.name,
    pattern: data.pattern.slice(0, len),
    subdivision: data.subdivision ?? "sixteenth",
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
  const sub = data.subdivision ?? "sixteenth";
  const payload: Record<string, unknown> = { ...data, updatedAt: now() };
  if (data.pattern != null) {
    payload.pattern = data.pattern.slice(0, PATTERN_LENGTHS[sub]);
  }
  await setDoc(doc(db, COURSES, courseId, RUDIMENTS_SUB, rudimentId), payload, { merge: true });
}

export async function deleteCourseRudiment(courseId: string, rudimentId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, COURSES, courseId, RUDIMENTS_SUB, rudimentId));
}

