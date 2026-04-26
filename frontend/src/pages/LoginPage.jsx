import { useState } from "react";
import LoginForm from "../components/login/LoginForm.jsx";
import { roles } from "../data/roles.js";

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState("admin");
  const activeRole = roles.find((role) => role.id === selectedRole) || roles[0];

  return (
    <main className="login-page">
      <div className="login-center">
        <h1 className="logo">UMS</h1>
        <p className="quote">
          Empowering education through simplicity and connection.
        </p>

        <LoginForm
          activeRole={activeRole}
          roles={roles}
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
        />
      </div>
    </main>
  );
}

export default LoginPage;