import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoginForm from "../components/login/LoginForm.jsx";
import { roles } from "../data/roles.js";
import { authApi } from "../services/api.js";
import "../styles/LoginPage.css";

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState("professor");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  
  const activeRole = roles.find((role) => role.id === selectedRole) || roles[0];

  const handleLogin = async (credentials) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await authApi.login({
        ...credentials,
        role: selectedRole,
      });
      
      // Store token and user data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      
      // Redirect based on role
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-center">
        <h1 className="logo">UMS</h1>
        <p className="quote">
          Empowering education through simplicity and connection.
        </p>

        {error && <div className="error-message">{error}</div>}
        
        <LoginForm
          activeRole={activeRole}
          roles={roles}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          onSubmit={handleLogin}
          isLoading={isLoading}
        />

        <p className="switch-mode">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;