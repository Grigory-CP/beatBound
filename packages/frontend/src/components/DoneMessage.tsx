import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";

interface DoneMessageProps {
  message: string;
}

// Shown after a mocked sign-up or login until role dashboards exist.
export default function DoneMessage({ message }: DoneMessageProps) {
  return (
    <div className="done" role="status">
      <CircleCheck className="done-icon" size={44} aria-hidden="true" />
      <p className="done-text">{message}</p>
      <Link className="submit" to="/">
        Back to start
      </Link>
    </div>
  );
}
