import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getFirebaseAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  getCourseById,
  getLessonsByCourseId,
  updateLesson,
  deleteLesson,
} from "@/lib/curriculum";
import type { Course, Lesson } from "@/types/curriculum";

export default function LessonList() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      const [c, list] = await Promise.all([
        getCourseById(courseId),
        getLessonsByCourseId(courseId),
      ]);
      setCourse(c ?? null);
      setLessons(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId]);

  async function handleMove(lesson: Lesson, direction: "up" | "down") {
    const idx = lessons.findIndex((l) => l.id === lesson.id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;
    const other = lessons[swapIdx];
    try {
      await updateLesson(lesson.id, { order: other.order });
      await updateLesson(other.id, { order: lesson.order });
      setLessons((prev) =>
        prev
          .map((l) =>
            l.id === lesson.id
              ? { ...l, order: other.order }
              : l.id === other.id
                ? { ...l, order: lesson.order }
                : l
          )
          .sort((a, b) => a.order - b.order)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reorder");
    }
  }

  async function handleDelete(lesson: Lesson) {
    if (!window.confirm(`Delete lesson "${lesson.title}"?`)) return;
    try {
      await deleteLesson(lesson.id);
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  async function handleSignOut() {
    await signOut(getFirebaseAuth());
    navigate("/", { replace: true });
  }

  if (!courseId) return <div style={{ padding: 24 }}>Missing course.</div>;
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!course) return <div style={{ padding: 24 }}>Course not found.</div>;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Link to="/courses" style={{ color: "#22c55e", marginBottom: 8, display: "inline-block" }}>← Courses</Link>
          <h1 style={{ fontSize: 24, margin: 0 }}>{course.title}</h1>
          <p style={{ color: "#71717a", marginTop: 4, fontSize: 14 }}>{course.description}</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to={`/courses/${courseId}/lessons/new`} style={linkButton}>Add lesson</Link>
          <Link to={`/courses/${courseId}/edit`} style={secondaryLink}>Edit course</Link>
          <button type="button" onClick={handleSignOut} style={secondaryButton}>Sign out</button>
        </div>
      </div>
      {error && <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>}
      {lessons.length === 0 ? (
        <p style={{ color: "#71717a" }}>No lessons yet. Add one to get started.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {lessons.map((lesson, idx) => (
            <li
              key={lesson.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                backgroundColor: "#18181b",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ display: "flex", gap: 4 }}>
                <button type="button" onClick={() => handleMove(lesson, "up")} disabled={idx === 0} style={smallButton}>↑</button>
                <button type="button" onClick={() => handleMove(lesson, "down")} disabled={idx === lessons.length - 1} style={smallButton}>↓</button>
              </span>
              <span style={{ flex: 1 }}>{lesson.title}</span>
              {lesson.rudimentId && <span style={{ fontSize: 12, color: "#22c55e" }}>Practice</span>}
              <Link to={`/courses/${courseId}/lessons/${lesson.id}/edit`} style={linkButton}>Edit</Link>
              <button type="button" onClick={() => handleDelete(lesson)} style={{ ...smallButton, color: "#ef4444" }}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const linkButton: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: 14,
  fontWeight: 500,
  backgroundColor: "#22c55e",
  color: "#000",
  borderRadius: 6,
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
};

const secondaryLink: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: 14,
  color: "#a1a1aa",
  textDecoration: "none",
  border: "1px solid #3f3f46",
  borderRadius: 6,
};

const secondaryButton: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: 14,
  backgroundColor: "transparent",
  color: "#a1a1aa",
  border: "1px solid #3f3f46",
  borderRadius: 6,
  cursor: "pointer",
};

const smallButton: React.CSSProperties = {
  padding: "4px 8px",
  fontSize: 12,
  backgroundColor: "#27272a",
  color: "#e4e4e7",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};
