import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { roles } from "../data/roles.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { authApi } from "../services/api.js";

const roleFields = {
  student: [
    { name: "studentId", label: "Student ID", placeholder: "STU001", required: true },
    { name: "department", label: "Department", placeholder: "Computer Science", required: true },
    { name: "dateOfBirth", label: "Date of Birth", type: "date" },
  ],
  professor: [
    { name: "employeeId", label: "Employee ID", placeholder: "EMP002", required: true },
    { name: "department", label: "Department", placeholder: "Computer Science", required: true },
    { name: "phone", label: "Phone", placeholder: "+20 100 000 0000", type: "tel" },
  ],
  staff: [
    { name: "employeeId", label: "Employee ID", placeholder: "EMP003", required: true },
    { name: "department", label: "Department", placeholder: "Registrar", required: true },
    { name: "phone", label: "Phone", placeholder: "+20 100 000 0000", type: "tel" },
  ],
  parent: [
    { name: "linkedStudentId", label: "Child Student ID", placeholder: "STU001", required: true },
    { name: "phone", label: "Phone", placeholder: "+20 100 000 0000", type: "tel" },
    { name: "address", label: "Address", placeholder: "Home address" },
  ],
};

const roleFieldNames = [...new Set(Object.values(roleFields).flat().map((field) => field.name))];
const signUpRoles = roles.filter((role) => role.id !== "admin");

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
    linkedStudentId: "",
    phone: "",
    address: "",
    dateOfBirth: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const activeRole = signUpRoles.find((role) => role.id === formData.role) || signUpRoles[0];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({
      ...prev,
      role,
      ...Object.fromEntries(roleFieldNames.map((fieldName) => [fieldName, ""])),
    }));
  };

  const buildRegistrationPayload = () => {
    const activeRoleFields = roleFields[formData.role] || [];
    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
    };

    activeRoleFields.forEach((field) => {
      const value = formData[field.name]?.trim();
      if (value) {
        payload[field.name] = value;
      }
    });

    return payload;
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

    const missingField = (roleFields[formData.role] || []).find(
      (field) => field.required && !formData[field.name].trim()
    );

    if (missingField) {
      setError(`${missingField.label} is required for ${activeRole.label} accounts`);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register(buildRegistrationPayload());

      login(response);

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
              {signUpRoles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  className={`role-option ${formData.role === role.id ? "active" : ""}`}
                  onClick={() => handleRoleChange(role.id)}
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

          {(roleFields[formData.role] || []).map((field) => (
            <label key={field.name}>
              {field.label}
              <input
                name={field.name}
                placeholder={field.placeholder}
                type={field.type || "text"}
                value={formData[field.name]}
                onChange={handleChange}
                required={Boolean(field.required)}
                disabled={isLoading}
              />
            </label>
          ))}

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
