import RoleSelector from "./RoleSelector.jsx";

function LoginForm({ activeRole, roles, selectedRole, onRoleChange }) {
  return (
    <form className="login-form">
      
      {/* Role Selection */}
      <RoleSelector
        roles={roles}
        selectedRole={selectedRole}
        onRoleChange={onRoleChange}
      />

      {/* Email */}
      <label>
        Email or ID
        <input
          autoComplete="username"
          name="identifier"
          placeholder="name@university.edu"
          type="text"
        />
      </label>

      {/* Password */}
      <label>
        Password
        <input
          autoComplete="current-password"
          name="password"
          placeholder="Enter your password"
          type="password"
        />
      </label>

      {/* Options */}
      <div className="form-row">
        <label className="remember-control">
          <input type="checkbox" />
          Remember me
        </label>
        <a href="#">Forgot?</a>
      </div>

      {/* Submit */}
      <button className="primary-action" type="submit">
        Login as {activeRole.label}
      </button>

    </form>
  );
}

export default LoginForm;