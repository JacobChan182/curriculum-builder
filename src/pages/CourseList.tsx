import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFirebaseAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { getCourses, updateCourse, deleteCourse } from "@/lib/curriculum";
import type { Course } from "@/types/curriculum";

export default function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getCourses();
      setCourses(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function handleMove(course: Course, direction: "up" | "down") {
    const idx = courses.findIndex((c) => c.id === course.id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= courses.length) return;
    const other = courses[swapIdx];
    try {
      await updateCourse(course.id, { order: other.order });
      await updateCourse(other.id, { order: course.order });
      setCourses((prev) =>
        prev
          .map((c) =>
            c.id === course.id
              ? { ...c, order: other.order }
              : c.id === other.id
                ? { ...c, order: course.order }
                : c
          )
          .sort((a, b) => a.order - b.order)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reorder");
    }
  }

  async function handleDelete(course: Course) {
    if (!window.confirm(`Delete course "${course.title}"?`)) return;
    try {
      await deleteCourse(course.id);
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  async function handleSignOut() {
    await signOut(getFirebaseAuth());
    navigate("/", { replace: true });
  }

  if (loading) return <div style={{ padding: 24 }}>Loading courses…</div>;
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Courses</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/courses/new" style={linkButton}>Add course</Link>
          <button type="button" onClick={handleSignOut} style={secondaryButton}>
            Sign out
          </button>
        </div>
      </div>
      {error && <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>}
      {courses.length === 0 ? (
        <p style={{ color: "#71717a" }}>No courses yet. Add one to get started.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {courses.map((course, idx) => (
            <li
              key={course.id}
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
                <button
                  type="button"
                  onClick={() => handleMove(course, "up")}
                  disabled={idx === 0}
                  style={smallButton}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(course, "down")}
                  disabled={idx === courses.length - 1}
                  style={smallButton}
                  title="Move down"
                >
                  ↓
                </button>
              </span>
              <Link
                to={`/courses/${course.id}/lessons`}
                style={{ flex: 1, color: "#22c55e", textDecoration: "none", fontWeight: 500 }}
              >
                {course.title}
              </Link>
              <Link to={`/courses/${course.id}/rudiments`} style={secondaryLink}>Rudiments</Link>
              <Link to={`/courses/${course.id}/edit`} style={linkButton}>Edit</Link>
              <button
                type="button"
                onClick={() => handleDelete(course)}
                style={{ ...smallButton, color: "#ef4444" }}
              >
                Delete
              </button>
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
