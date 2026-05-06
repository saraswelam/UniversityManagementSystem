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
import ApplicationsPage from "./pages/ApplicationsPage/ApplicationsPage";
import RoomBookingsPage from "./pages/RoomBookingsPage/RoomBookingsPage";
import LeaveRequestsPage from "./pages/LeaveRequestsPage/LeaveRequestsPage";
import PayrollPage from "./pages/PayrollPage/PayrollPage";
import StaffDirectoryPage from "./pages/StaffDirectoryPage/StaffDirectoryPage";
import EnrollmentsPage from "./pages/EnrollmentsPage/EnrollmentsPage";
import StudentsPage from "./pages/StudentsPage/StudentsPage";
import StaffAvailabilityPage from "./pages/StaffAvailabilityPage/StaffAvailabilityPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuth } from "./auth/AuthContext";
import { routeAccess, getDefaultRouteForRole } from "./data/routeAccess";

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Outlet />;

  return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
}

function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  const role = user?.role;

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  return children;
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
          <Route
            path="/dashboard"
            element={(
              <RoleRoute allowedRoles={routeAccess["/dashboard"]}>
                <Dashboard />
              </RoleRoute>
            )}
          />
          <Route
            path="/courses"
            element={(
              <RoleRoute allowedRoles={routeAccess["/courses"]}>
                <CoursesPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/assignments"
            element={(
              <RoleRoute allowedRoles={routeAccess["/assignments"]}>
                <AssignmentsPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/discussions"
            element={(
              <RoleRoute allowedRoles={routeAccess["/discussions"]}>
                <DiscussionsPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/office-hours"
            element={(
              <RoleRoute allowedRoles={routeAccess["/office-hours"]}>
                <OfficeHoursPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/meetings"
            element={(
              <RoleRoute allowedRoles={routeAccess["/meetings"]}>
                <MeetingsPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/messages"
            element={(
              <RoleRoute allowedRoles={routeAccess["/messages"]}>
                <MessagesPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/announcements"
            element={(
              <RoleRoute allowedRoles={routeAccess["/announcements"]}>
                <AnnouncementsPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/applications"
            element={(
              <RoleRoute allowedRoles={routeAccess["/applications"]}>
                <ApplicationsPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/enrollments"
            element={(
              <RoleRoute allowedRoles={routeAccess["/enrollments"]}>
                <EnrollmentsPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/students"
            element={(
              <RoleRoute allowedRoles={routeAccess["/students"]}>
                <StudentsPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/staff-availability"
            element={(
              <RoleRoute allowedRoles={routeAccess["/staff-availability"]}>
                <StaffAvailabilityPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/room-bookings"
            element={(
              <RoleRoute allowedRoles={routeAccess["/room-bookings"]}>
                <RoomBookingsPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/staff-directory"
            element={(
              <RoleRoute allowedRoles={routeAccess["/staff-directory"]}>
                <StaffDirectoryPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/leave-requests"
            element={(
              <RoleRoute allowedRoles={routeAccess["/leave-requests"]}>
                <LeaveRequestsPage />
              </RoleRoute>
            )}
          />
          <Route
            path="/payroll"
            element={(
              <RoleRoute allowedRoles={routeAccess["/payroll"]}>
                <PayrollPage />
              </RoleRoute>
            )}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
