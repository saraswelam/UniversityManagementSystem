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
import RoomBookingsPage from "./pages/RoomBookingsPage/RoomBookingsPage";
import LeaveRequestsPage from "./pages/LeaveRequestsPage/LeaveRequestsPage";
import PayrollPage from "./pages/PayrollPage/PayrollPage";
import StaffPage from "./pages/StaffPage/StaffPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";

function isLoggedIn() {
  return Boolean(localStorage.getItem("token"));
}

function getUserRole() {
  return JSON.parse(localStorage.getItem("user") || "{}").role;
}

function ProtectedRoute() {
  return isLoggedIn() ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  return isLoggedIn() ? <Navigate to="/dashboard" replace /> : <Outlet />;
}

function RoleProtectedRoute({ allowedRoles, children }) {
  const role = getUserRole();

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

const routeConfig = [
  {
    path: "/dashboard",
    component: Dashboard,
    roles: ["admin", "student", "professor", "parent", "staff"],
  },
  {
    path: "/courses",
    component: CoursesPage,
    roles: ["admin", "student", "professor"],
  },
  {
    path: "/assignments",
    component: AssignmentsPage,
    roles: ["admin", "student", "professor"],
  },
  {
    path: "/discussions",
    component: DiscussionsPage,
    roles: ["admin", "student", "professor"],
  },
  {
    path: "/office-hours",
    component: OfficeHoursPage,
    roles: ["admin", "student", "professor"],
  },
  {
    path: "/meetings",
    component: MeetingsPage,
    roles: ["admin", "student", "professor", "parent", "staff"],
  },
  {
    path: "/messages",
    component: MessagesPage,
    roles: ["admin", "student", "professor", "parent", "staff"],
  },
  {
    path: "/announcements",
    component: AnnouncementsPage,
    roles: ["admin", "student", "professor"],
  },
  {
    path: "/room-bookings",
    component: RoomBookingsPage,
    roles: ["admin", "staff"],
  },
  {
    path: "/staff",
    component: StaffPage,
    roles: ["admin"],
  },
  {
    path: "/leave-requests",
    component: LeaveRequestsPage,
    roles: ["admin", "staff"],
  },
  {
    path: "/payroll",
    component: PayrollPage,
    roles: ["admin", "staff"],
  },
];

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
          {routeConfig.map(({ path, component: Component, roles }) => (
            <Route
              key={path}
              path={path}
              element={(
                <RoleProtectedRoute allowedRoles={roles}>
                  <Component />
                </RoleProtectedRoute>
              )}
            />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
