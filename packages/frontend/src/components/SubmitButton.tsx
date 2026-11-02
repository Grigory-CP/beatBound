import type { ReactNode } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";

interface SubmitButtonProps {
  busy?: boolean;
  children: ReactNode;
}

export default function SubmitButton({ busy, children }: SubmitButtonProps) {
  return (
    <button type="submit" className="submit" disabled={busy} aria-busy={busy}>
      {children}
      {busy ? (
        <LoaderCircle className="submit-spinner" size={22} aria-hidden="true" />
      ) : (
        <ArrowRight className="submit-arrow" size={22} aria-hidden="true" />
      )}
    </button>
  );
}
