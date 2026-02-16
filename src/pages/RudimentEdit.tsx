import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getCourseRudimentById,
  getCourseRudiments,
  createCourseRudiment,
  updateCourseRudiment,
  PATTERN_LENGTHS,
} from "@/lib/curriculum";
import type { PatternCell, RudimentSubdivision } from "@/types/curriculum";

export default function RudimentEdit() {
  const { courseId, rudimentId } = useParams<{ courseId: string; rudimentId: string }>();
  const isNew = !rudimentId || rudimentId === "new";
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [subdivision, setSubdivision] = useState<RudimentSubdivision>("sixteenth");
  const [pattern, setPattern] = useState<PatternCell[]>(() => Array(PATTERN_LENGTHS.sixteenth).fill(""));
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew && courseId) {
      getCourseRudiments(courseId).then((list) => setOrder(list.length));
      setLoading(false);
      return;
    }
    if (!courseId || !rudimentId) return;
    let cancelled = false;
    getCourseRudimentById(courseId, rudimentId).then((r) => {
      if (cancelled || !r) return;
      setName(r.name);
      setSubdivision(r.subdivision ?? "sixteenth");
      const len = PATTERN_LENGTHS[r.subdivision ?? "sixteenth"];
      const p = r.pattern.length === len ? [...r.pattern] : [...r.pattern.slice(0, len), ...Array(Math.max(0, len - r.pattern.length)).fill("")];
      setPattern(p);
      setOrder(r.order);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [courseId, rudimentId, isNew]);

  function handleCellClick(index: number, hand: "L" | "R") {
    setPattern((prev) => {
      const next = [...prev];
      const current = next[index];
      if (current === hand) {
        next[index] = "";
      } else {
        next[index] = hand;
      }
      return next;
    });
  }

  function handleCellContextMenu(e: React.MouseEvent, index: number) {
    e.preventDefault();
    handleCellClick(index, "R");
  }

  function handleSubdivisionChange(next: RudimentSubdivision) {
    if (next === subdivision) return;
    const oldLen = PATTERN_LENGTHS[subdivision];
    const newLen = PATTERN_LENGTHS[next];
    setSubdivision(next);
    setPattern((prev) => {
      if (newLen > oldLen) {
        return [...prev, ...Array(newLen - oldLen).fill("")];
      }
      return prev.slice(0, newLen);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId) return;
    setError("");
    setSaving(true);
    try {
      if (isNew) {
        await createCourseRudiment(courseId, { name, pattern, subdivision, order });
        navigate(`/courses/${courseId}/rudiments`, { replace: true });
      } else {
        await updateCourseRudiment(courseId, rudimentId!, { name, pattern, subdivision, order });
        navigate(`/courses/${courseId}/rudiments`, { replace: true });
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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <Link to={`/courses/${courseId}/rudiments`} style={{ color: "#22c55e", marginBottom: 16, display: "inline-block" }}>
        ← Back to rudiments
      </Link>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>{isNew ? "New rudiment" : "Edit rudiment"}</h1>
      <p style={{ color: "#71717a", marginBottom: 16, fontSize: 14 }}>
        Left click = L, right click = R, click again = rest.
        {subdivision === "sixteenth" ? " 32 cells = 32 sixteenth notes." : " 24 cells = 24 eighth-note triplets (2 bars)."}
      </p>
      {error && <p style={{ color: "#ef4444", marginBottom: 16 }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 8 }}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, marginBottom: 8 }}>
          <span>Triplets</span>
          <button
            type="button"
            role="switch"
            aria-checked={subdivision === "eighthTriplet"}
            onClick={() => handleSubdivisionChange(subdivision === "eighthTriplet" ? "sixteenth" : "eighthTriplet")}
            style={{
              ...switchTrackStyle,
              backgroundColor: subdivision === "eighthTriplet" ? "#22c55e" : "#27272a",
            }}
          >
            <span
              style={{
                ...switchThumbStyle,
                transform: subdivision === "eighthTriplet" ? "translateX(20px)" : "translateX(2px)",
              }}
            />
          </button>
          <span style={{ color: "#71717a", fontSize: 14 }}>
            {subdivision === "eighthTriplet" ? "Eighth-note triplets (24 cells)" : "Sixteenth notes (32 cells)"}
          </span>
        </label>
        <label style={{ display: "block", marginTop: 12, marginBottom: 8 }}>
          Pattern ({subdivision === "sixteenth" ? "32 sixteenth notes" : "24 eighth-note triplets"})
        </label>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 24,
          }}
        >
          {pattern.map((cell, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleCellClick(index, "L")}
              onContextMenu={(e) => handleCellContextMenu(e, index)}
              style={{
                ...cellStyle,
                ...(cell === "L" ? cellStyleL : cell === "R" ? cellStyleR : {}),
              }}
              title={`#${index + 1}: Left = L, Right = R`}
            >
              {cell || "·"}
            </button>
          ))}
        </div>
        <button type="submit" disabled={saving} style={{ ...buttonStyle, marginTop: 8 }}>
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

const cellStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  padding: 0,
  fontSize: 14,
  fontWeight: 600,
  backgroundColor: "#27272a",
  color: "#a1a1aa",
  border: "1px solid #3f3f46",
  borderRadius: 6,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const cellStyleL: React.CSSProperties = {
  backgroundColor: "#3b82f6",
  color: "#fff",
  borderColor: "#3b82f6",
};

const cellStyleR: React.CSSProperties = {
  backgroundColor: "#22c55e",
  color: "#000",
  borderColor: "#22c55e",
};

const switchTrackStyle: React.CSSProperties = {
  width: 44,
  height: 24,
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  padding: 0,
  position: "relative",
  transition: "background-color 0.2s",
};

const switchThumbStyle: React.CSSProperties = {
  position: "absolute",
  top: 2,
  left: 0,
  width: 20,
  height: 20,
  borderRadius: 10,
  backgroundColor: "#fff",
  transition: "transform 0.2s",
};
