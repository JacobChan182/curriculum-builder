import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getFirebaseAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  getCourseById,
  getCourseRudiments,
  updateCourseRudiment,
  deleteCourseRudiment,
} from "@/lib/curriculum";
import type { Course, CourseRudiment } from "@/types/curriculum";

export default function RudimentList() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [rudiments, setRudiments] = useState<CourseRudiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      const [c, list] = await Promise.all([
        getCourseById(courseId),
        getCourseRudiments(courseId),
      ]);
      setCourse(c ?? null);
      setRudiments(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId]);

  async function handleMove(rudiment: CourseRudiment, direction: "up" | "down") {
    const idx = rudiments.findIndex((r) => r.id === rudiment.id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= rudiments.length) return;
    const other = rudiments[swapIdx];
    try {
      await updateCourseRudiment(courseId!, rudiment.id, { order: other.order });
      await updateCourseRudiment(courseId!, other.id, { order: rudiment.order });
      setRudiments((prev) =>
        prev
          .map((r) =>
            r.id === rudiment.id
              ? { ...r, order: other.order }
              : r.id === other.id
                ? { ...r, order: rudiment.order }
                : r
          )
          .sort((a, b) => a.order - b.order)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reorder");
    }
  }

  async function handleDelete(rudiment: CourseRudiment) {
    if (!window.confirm(`Delete rudiment "${rudiment.name}"?`)) return;
    try {
      await deleteCourseRudiment(courseId!, rudiment.id);
      setRudiments((prev) => prev.filter((r) => r.id !== rudiment.id));
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

  const title = course?.title ?? "Course";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      {!course && (
        <p style={{ color: "#f59e0b", marginBottom: 16, padding: 12, backgroundColor: "#422006", borderRadius: 8 }}>
          Course document not found in Firestore for ID: <code style={{ fontSize: 12 }}>{courseId}</code>. Check that the curriculum builder uses the same Firebase project as your rhythm app (.env VITE_FIREBASE_*).
        </p>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Link to="/courses" style={{ color: "#22c55e", marginBottom: 8, display: "inline-block" }}>← Courses</Link>
          <h1 style={{ fontSize: 24, margin: 0 }}>Rudiments: {title}</h1>
          <p style={{ color: "#71717a", marginTop: 4, fontSize: 14 }}>32 cells = 32 sixteenth notes. L / R / rest.</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link to={`/courses/${courseId}/rudiments/new`} style={linkButton}>Add rudiment</Link>
          <button type="button" onClick={handleSignOut} style={secondaryButton}>Sign out</button>
        </div>
      </div>
      {error && <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>}
      {rudiments.length === 0 ? (
        <p style={{ color: "#71717a" }}>No rudiments yet. Add one and edit the 32-box pattern (left = L, right = R, click again = rest).</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rudiments.map((r, idx) => (
            <li
              key={r.id}
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
                <button type="button" onClick={() => handleMove(r, "up")} disabled={idx === 0} style={smallButton}>↑</button>
                <button type="button" onClick={() => handleMove(r, "down")} disabled={idx === rudiments.length - 1} style={smallButton}>↓</button>
              </span>
              <span style={{ flex: 1 }}>{r.name}</span>
              <Link to={`/courses/${courseId}/rudiments/${r.id}/edit`} style={linkButton}>Edit</Link>
              <button type="button" onClick={() => handleDelete(r)} style={{ ...smallButton, color: "#ef4444" }}>Delete</button>
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
