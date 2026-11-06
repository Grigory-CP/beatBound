import type { ComponentType } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import Home from "./pages/Home";
import { isRole, type Role } from "./auth/roles";

function RolePage({ page: Page }: { page: ComponentType<{ role: Role }> }) {
  const { role } = useParams();
  // key resets form state when switching roles.
  return isRole(role) ? (
    <Page key={role} role={role} />
  ) : (
    <Navigate to="/" replace />
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/home" element={<Home />} />
      <Route path="/signup/:role" element={<RolePage page={Signup} />} />
      <Route path="/login/:role" element={<RolePage page={Login} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
