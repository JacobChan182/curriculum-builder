import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getLessonById,
  getLessonsByCourseId,
  getCourseRudiments,
  createLesson,
  updateLesson,
  RUDIMENT_OPTIONS,
} from "@/lib/curriculum";

export default function LessonEdit() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const isNew = !lessonId || lessonId === "new";
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [order, setOrder] = useState(0);
  const [rudimentIds, setRudimentIds] = useState<string[]>([]);
  const [courseRudimentOptions, setCourseRudimentOptions] = useState<{ value: string; label: string }[]>([]);
  const [suggestedBpm, setSuggestedBpm] = useState<string>("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (courseId) {
      getCourseRudiments(courseId).then((list) => {
        setCourseRudimentOptions(
          list.map((r) => ({ value: `course:${courseId}:${r.id}`, label: `${r.name} (course)` }))
        );
      });
    }
  }, [courseId]);

  useEffect(() => {
    if (isNew && courseId) {
      getLessonsByCourseId(courseId).then((list) => setOrder(list.length));
      setLoading(false);
      return;
    }
    if (!lessonId) return;
    let cancelled = false;
    getLessonById(lessonId).then((l) => {
      if (cancelled || !l) return;
      setTitle(l.title);
      setBody(l.body);
      setOrder(l.order);
      setRudimentIds(l.rudimentIds ?? []);
      setSuggestedBpm(l.suggestedBpm != null ? String(l.suggestedBpm) : "");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [lessonId, courseId, isNew]);

  function toggleRudiment(value: string) {
    setRudimentIds((prev) =>
      prev.includes(value) ? prev.filter((id) => id !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setError("");
    setSaving(true);
    try {
      const bpm = suggestedBpm.trim() ? parseInt(suggestedBpm, 10) : undefined;
      if (isNew) {
        await createLesson({
          courseId,
          title,
          body,
          order,
          rudimentIds,
          suggestedBpm: Number.isFinite(bpm) ? bpm : undefined,
        });
        navigate(`/courses/${courseId}/lessons`, { replace: true });
      } else {
        await updateLesson(lessonId!, {
          title,
          body,
          order,
          rudimentIds,
          suggestedBpm: Number.isFinite(bpm) ? bpm : undefined,
        });
        navigate(`/courses/${courseId}/lessons`, { replace: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!courseId) return <div style={{ padding: 24 }}>Missing course.</div>;
  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24 }}>
      <Link to={`/courses/${courseId}/lessons`} style={{ color: "#22c55e", marginBottom: 16, display: "inline-block" }}>
        ← Back to lessons
      </Link>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>{isNew ? "New lesson" : "Edit lesson"}</h1>
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
        <label style={{ display: "block", marginTop: 16, marginBottom: 8 }}>Body (markdown or plain text)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
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
        <label style={{ display: "block", marginTop: 16, marginBottom: 8 }}>Rudiments in this lesson (student will practice these)</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RUDIMENT_OPTIONS.map((opt) => (
            <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rudimentIds.includes(opt.value)}
                onChange={() => toggleRudiment(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
          {courseRudimentOptions.map((opt) => (
            <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rudimentIds.includes(opt.value)}
                onChange={() => toggleRudiment(opt.value)}
              />
              <span>{opt.label}</span>
            </label>
          ))}
          {RUDIMENT_OPTIONS.length === 0 && courseRudimentOptions.length === 0 && (
            <span style={{ color: "#71717a", fontSize: 14 }}>Add global rudiments in RUDIMENT_OPTIONS or course rudiments in this course’s Rudiments page.</span>
          )}
        </div>
        <label style={{ display: "block", marginTop: 16, marginBottom: 8 }}>Suggested BPM (optional)</label>
        <input
          type="number"
          min={40}
          max={240}
          value={suggestedBpm}
          onChange={(e) => setSuggestedBpm(e.target.value)}
          placeholder="e.g. 80"
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
