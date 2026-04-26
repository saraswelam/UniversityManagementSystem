function RoleSelector({ roles, selectedRole, onRoleChange }) {
  return (
    <div className="role-grid" aria-label="Choose account role">
      {roles.map((role) => (
        <button
          className={`role-option ${selectedRole === role.id ? "active" : ""}`}
          key={role.id}
          onClick={() => onRoleChange(role.id)}
          type="button"
        >
          <span>{role.label}</span>
        </button>
      ))}
    </div>
  );
}

export default RoleSelector;
