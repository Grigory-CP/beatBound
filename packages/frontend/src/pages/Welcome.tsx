import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import Mascot from "../components/Mascot";
import NoteGlyph from "../components/NoteGlyph";
import { ROLE_CONFIG, ROLES } from "../auth/roles";
import "./Welcome.css";

export default function Welcome() {
  return (
    <div className="welcome">
      <div className="welcome-deco" aria-hidden="true">
        <span className="welcome-blob is-teal" />
        <span className="welcome-blob is-pink" />
        <NoteGlyph className="welcome-note is-left" />
        <NoteGlyph className="welcome-note is-right" />
      </div>

      <main className="welcome-main">
        <Mascot />
        <p className="welcome-eyebrow">Music learning, reimagined</p>
        <h1 className="welcome-title">
          Welcome to <span className="welcome-brand">beatBound</span>
        </h1>
        <p className="welcome-lede">
          Practice with purpose. Build confidence. Find your rhythm.
        </p>

        <nav className="welcome-roles" aria-label="Choose who you are">
          {ROLES.map((role) => {
            const { title, tagline, icon: Icon } = ROLE_CONFIG[role];
            return (
              <Link
                key={role}
                to={`/signup/${role}`}
                className={`role-card theme-${role}`}
              >
                <span className="role-card-icon" aria-hidden="true">
                  <Icon size={26} strokeWidth={1.75} />
                </span>
                <span className="role-card-text">
                  <span className="role-card-title">{title}</span>
                  <span className="role-card-tagline">{tagline}</span>
                </span>
                <ArrowRight
                  className="role-card-arrow"
                  size={24}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        <p className="welcome-footer">
          <ShieldCheck size={18} aria-hidden="true" />
          Safe, focused, and made for young musicians
        </p>
      </main>
    </div>
  );
}
