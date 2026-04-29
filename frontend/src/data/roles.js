export const roles = [
  { id: "student", label: "Student" },
  { id: "professor", label: "Professor" },
  { id: "admin", label: "Admin" },
  { id: "staff", label: "Staff" },
  { id: "parent", label: "Parent" },
];

export function getRoleLabel(roleId) {
  return roles.find((role) => role.id === roleId)?.label || "User";
}
