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
import type { Course, Lesson } from "@/types/curriculum";

const COURSES = "courses";
const LESSONS = "lessons";

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
    return {
      id: d.id,
      courseId: data.courseId ?? courseId,
      title: data.title ?? "",
      body: data.body ?? "",
      order: typeof data.order === "number" ? data.order : 0,
      rudimentId: data.rudimentId,
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
  return {
    id: snap.id,
    courseId: data.courseId ?? "",
    title: data.title ?? "",
    body: data.body ?? "",
    order: typeof data.order === "number" ? data.order : 0,
    rudimentId: data.rudimentId,
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

export async function createLesson(data: Omit<Lesson, "id" | "updatedAt">): Promise<string> {
  const db = getFirebaseDb();
  const ref = collection(db, LESSONS);
  const docRef = await addDoc(ref, {
    courseId: data.courseId,
    title: data.title,
    body: data.body,
    order: data.order,
    ...(data.rudimentId != null && { rudimentId: data.rudimentId }),
    ...(data.suggestedBpm != null && { suggestedBpm: data.suggestedBpm }),
    updatedAt: now(),
  });
  return docRef.id;
}

export async function updateLesson(lessonId: string, data: Partial<Omit<Lesson, "id" | "courseId">>): Promise<void> {
  const db = getFirebaseDb();
  const payload: Record<string, unknown> = { ...data, updatedAt: now() };
  if (data.rudimentId === undefined) delete payload.rudimentId;
  if (data.suggestedBpm === undefined) delete payload.suggestedBpm;
  await setDoc(doc(db, LESSONS, lessonId), payload, { merge: true });
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const db = getFirebaseDb();
  await deleteDoc(doc(db, LESSONS, lessonId));
}

export const RUDIMENT_OPTIONS = [
  { value: "", label: "(none)" },
  { value: "paradiddle-1", label: "Paradiddle" },
];
