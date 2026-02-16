import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getCourseById,
  createCourse,
  updateCourse,
  getCourses,
} from "@/lib/curriculum";

export default function CourseEdit() {
  const { courseId } = useParams<{ courseId: string }>();
  const isNew = !courseId || courseId === "new";
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) {
      getCourses().then((list) => setOrder(list.length));
      return;
    }
    let cancelled = false;
    getCourseById(courseId!).then((c) => {
      if (cancelled || !c) return;
      setTitle(c.title);
      setDescription(c.description);
      setOrder(c.order);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [courseId, isNew]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isNew) {
        const id = await createCourse({ title, description, order });
        navigate(`/courses/${id}/rudiments`, { replace: true });
      } else {
        await updateCourse(courseId!, { title, description, order });
        navigate("/courses", { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24 }}>
      <Link to={isNew ? "/courses" : `/courses/${courseId}/rudiments`} style={{ color: "#22c55e", marginBottom: 16, display: "inline-block" }}>
        ← Back
      </Link>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>{isNew ? "New course" : "Edit course"}</h1>
      {error && <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 8 }}>Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={inputStyle}
        />
        <label style={{ display: "block", marginTop: 16, marginBottom: 8 }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <label style={{ display: "block", marginTop: 16, marginBottom: 8 }}>Order</label>
        <input
          type="number"
          min={0}
          value={order}
          onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
          style={inputStyle}
        />
        <button type="submit" disabled={saving} style={{ ...buttonStyle, marginTop: 24 }}>
          {saving ? "Saving…" : isNew ? "Create" : "Save"}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  fontSize: 16,
  backgroundColor: "#18181b",
  border: "1px solid #27272a",
  borderRadius: 8,
  color: "#fff",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 24px",
  fontSize: 16,
  fontWeight: 600,
  backgroundColor: "#22c55e",
  color: "#000",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};
