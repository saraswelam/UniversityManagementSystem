export const routeAccess = {
  "/dashboard": ["admin", "student", "professor", "parent", "staff"],
  "/courses": ["admin", "student", "professor"],
  "/assignments": ["admin", "student", "professor"],
  "/discussions": ["admin", "student", "professor"],
  "/office-hours": ["admin", "student", "professor"],
  "/meetings": ["admin", "student", "professor", "parent", "staff"],
  "/messages": ["admin", "student", "professor", "parent", "staff"],
  "/announcements": ["admin", "student", "professor"],
  "/applications": ["admin"],
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
