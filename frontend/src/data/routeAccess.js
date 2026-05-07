export const routeAccess = {
  "/dashboard": ["admin", "student", "professor", "parent", "staff"],
  "/schedule": ["student"],
  "/courses": ["admin", "student", "professor"],
  "/courses/:id": ["student"],
  "/assignments": ["student", "professor"],
  "/grades": ["student"],
  "/discussions": ["admin", "student", "professor"],
  "/office-hours": ["professor"],
  "/meetings": ["admin", "professor", "parent", "staff"],
  "/messages": ["admin", "professor", "parent", "staff"],
  "/announcements": ["admin", "professor"],
  "/applications": ["admin"],
  "/enrollments": ["admin"],
  "/students": ["admin"],
  "/staff-availability": ["admin"],
  "/room-bookings": ["admin", "staff"],
  "/staff-directory": ["admin"],
  "/leave-requests": ["admin", "staff"],
  "/payroll": ["admin", "staff"],
};

const roleDefaultRoutes = {
  admin: "/dashboard",
  student: "/dashboard",
  professor: "/dashboard",
  parent: "/dashboard",
  staff: "/dashboard",
};

export function getDefaultRouteForRole(role) {
  return roleDefaultRoutes[role] || "/dashboard";
}
