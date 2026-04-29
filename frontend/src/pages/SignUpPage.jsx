import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { roles } from "../data/roles.js";
import { authApi } from "../services/api.js";

function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    studentId: "",
    employeeId: "",
    department: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const activeRole = roles.find((role) => role.id === formData.role) || roles[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        studentId: formData.role === "student" ? formData.studentId : undefined,
        employeeId: ["professor", "staff"].includes(formData.role) ? formData.employeeId : undefined,
        department: formData.department,
      });

      // Store token and user data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-center">
        <h1 className="logo">UMS</h1>
        <p className="quote">
          Create your account to get started.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label>I am a...</label>
            <div className="role-grid">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`role-option ${formData.role === role.id ? "active" : ""}`}
                  onClick={() => setFormData((prev) => ({ ...prev, role: role.id }))}
                  disabled={isLoading}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name Fields */}
          <div className="name-row">
            <label>
              First Name
              <input
                name="firstName"
                placeholder="John"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </label>
            <label>
              Last Name
              <input
                name="lastName"
                placeholder="Doe"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </label>
          </div>

          {/* Email */}
          <label>
            Email
            <input
              name="email"
              placeholder="john.doe@university.edu"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </label>

          {/* Role-specific ID */}
          {formData.role === "student" && (
            <label>
              Student ID
              <input
                name="studentId"
                placeholder="STU001"
                type="text"
                value={formData.studentId}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </label>
          )}

          {["professor", "staff"].includes(formData.role) && (
            <label>
              Employee ID
              <input
                name="employeeId"
                placeholder="EMP001"
                type="text"
                value={formData.employeeId}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </label>
          )}

          {/* Department */}
          <label>
            Department
            <input
              name="department"
              placeholder="Computer Science"
              type="text"
              value={formData.department}
              onChange={handleChange}
              disabled={isLoading}
            />
          </label>

          {/* Password */}
          <label>
            Password
            <input
              name="password"
              placeholder="At least 6 characters"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </label>

          {/* Confirm Password */}
          <label>
            Confirm Password
            <input
              name="confirmPassword"
              placeholder="Re-enter password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </label>

          {/* Submit */}
          <button className="primary-action" type="submit" disabled={isLoading}>
            {isLoading ? "Creating Account..." : `Sign Up as ${activeRole.label}`}
          </button>
        </form>

        <p className="switch-mode">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}

export default SignUpPage;