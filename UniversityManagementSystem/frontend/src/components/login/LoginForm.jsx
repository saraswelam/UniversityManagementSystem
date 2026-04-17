import RoleSelector from "./RoleSelector.jsx";

function LoginForm({
  activeRole,
  roles,
  selectedRole,
  onRoleChange,
  onSubmit,
  isLoading,
  fieldErrors = {},
}) {
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
          aria-describedby={fieldErrors.identifier ? "identifier-error" : undefined}
          aria-invalid={Boolean(fieldErrors.identifier)}
          className={fieldErrors.identifier ? "input-error" : ""}
          name="identifier"
          placeholder="name@university.edu"
          type="text"
          required
          disabled={isLoading}
        />
        {fieldErrors.identifier && (
          <span className="field-error" id="identifier-error">
            {fieldErrors.identifier}
          </span>
        )}
      </label>

      {/* Password */}
      <label>
        Password
        <input
          autoComplete="current-password"
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          aria-invalid={Boolean(fieldErrors.password)}
          className={fieldErrors.password ? "input-error" : ""}
          name="password"
          placeholder="Enter your password"
          type="password"
          required
          disabled={isLoading}
        />
        {fieldErrors.password && (
          <span className="field-error" id="password-error">
            {fieldErrors.password}
          </span>
        )}
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