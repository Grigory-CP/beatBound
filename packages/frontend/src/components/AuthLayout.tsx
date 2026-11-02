import type { ReactNode } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { ROLE_CONFIG, type Role } from "../auth/roles";
import "./AuthLayout.css";

interface AuthLayoutProps {
  role: Role;
  heading: string;
  subheading: string;
  backLabel?: string;
  onBack: () => void;
  children: ReactNode;
}

export default function AuthLayout({
  role,
  heading,
  subheading,
  backLabel = "Back",
  onBack,
  children
}: AuthLayoutProps) {
  const Icon = ROLE_CONFIG[role].icon;

  return (
    <div className={`auth-page theme-${role}`}>
      <button type="button" className="auth-back" onClick={onBack}>
        <ArrowLeft size={20} aria-hidden="true" />
        {backLabel}
      </button>

      <main className="auth-card">
        <div className="auth-icon" aria-hidden="true">
          <Icon size={34} strokeWidth={1.75} />
        </div>
        <h1 className="auth-heading">{heading}</h1>
        <p className="auth-subheading">{subheading}</p>
        {children}
        <p className="auth-note">
          <Lock size={15} aria-hidden="true" />
          Your information stays private and secure.
        </p>
      </main>
    </div>
  );
}
