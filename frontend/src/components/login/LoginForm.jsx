import RoleSelector from "./RoleSelector.jsx";

function LoginForm({ activeRole, roles, selectedRole, onRoleChange, onSubmit, isLoading }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const credentials = {
      identifier: formData.get("identifier"),
      password: formData.get("password"),
    };
    onSubmit(credentials);
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      
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
          required
          disabled={isLoading}
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
          required
          disabled={isLoading}
        />
      </label>

      {/* Options */}
      <div className="form-row">
        <label className="remember-control">
          <input type="checkbox" disabled={isLoading} />
          Remember me
        </label>
        <a href="#">Forgot?</a>
      </div>

      {/* Submit */}
      <button className="primary-action" type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : `Login as ${activeRole.label}`}
      </button>

    </form>
  );
}

export default LoginForm;