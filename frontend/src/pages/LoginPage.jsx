import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import LoginForm from "../components/login/LoginForm.jsx";
import { roles } from "../data/roles.js";
import { getDefaultRouteForRole } from "../data/routeAccess.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { authApi } from "../services/api.js";
import "../styles/LoginPage.css";

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState("professor");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const activeRole = roles.find((role) => role.id === selectedRole) || roles[0];

  const handleLogin = async (credentials) => {
    setError("");
    const identifier = credentials.identifier?.trim();
    const password = credentials.password?.trim();

    if (!identifier || !password) {
      setError("Email/ID and password are required");
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await authApi.login({
        identifier,
        password,
        role: selectedRole,
      });
      
      login(response);
      
      // Redirect based on role
      navigate(getDefaultRouteForRole(response.user?.role), { replace: true });
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
