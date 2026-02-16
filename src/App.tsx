import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useAdminCheck } from "./hooks/useAdminCheck";
import Login from "./pages/Login";
import CourseList from "./pages/CourseList";
import CourseEdit from "./pages/CourseEdit";
import RudimentList from "./pages/RudimentList";
import RudimentEdit from "./pages/RudimentEdit";

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck(user?.uid ?? null);

  if (authLoading || adminLoading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>Loading…</div>
    );
  }
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (!isAdmin) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <p>Access denied. You are not an admin.</p>
        <p style={{ marginTop: 8, color: "#71717a" }}>
          Add your UID to Firestore <code>admins/{user.uid}</code> with{" "}
          <code>role: "admin"</code>.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/courses"
        element={
          <ProtectedAdmin>
            <CourseList />
          </ProtectedAdmin>
        }
      />
      <Route
        path="/courses/new"
        element={
          <ProtectedAdmin>
            <CourseEdit />
          </ProtectedAdmin>
        }
      />
      <Route
        path="/courses/:courseId/edit"
        element={
          <ProtectedAdmin>
            <CourseEdit />
          </ProtectedAdmin>
        }
      />
      <Route
        path="/courses/:courseId/rudiments"
        element={
          <ProtectedAdmin>
            <RudimentList />
          </ProtectedAdmin>
        }
      />
      <Route
        path="/courses/:courseId/rudiments/new"
        element={
          <ProtectedAdmin>
            <RudimentEdit />
          </ProtectedAdmin>
        }
      />
      <Route
        path="/courses/:courseId/rudiments/:rudimentId/edit"
        element={
          <ProtectedAdmin>
            <RudimentEdit />
          </ProtectedAdmin>
        }
      />
    </Routes>
  );
}
