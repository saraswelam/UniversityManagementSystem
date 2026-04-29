import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import CoursesPage from "./pages/CoursesPage/CoursesPage";
import AssignmentsPage from "./pages/AssignmentsPage/AssignmentsPage";
import DiscussionsPage from "./pages/DiscussionsPage/DiscussionsPage";
import OfficeHoursPage from "./pages/OfficeHoursPage/OfficeHoursPage";
import MeetingsPage from "./pages/MeetingsPage/MeetingsPage";
import MessagesPage from "./pages/MessagesPage/MessagesPage";
import AnnouncementsPage from "./pages/AnnouncementsPage/AnnouncementsPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

function isLoggedIn() {
  return Boolean(localStorage.getItem("token"));
}

function ProtectedRoute() {
  return isLoggedIn() ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  return isLoggedIn() ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/discussions" element={<DiscussionsPage />} />
          <Route path="/office-hours" element={<OfficeHoursPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
