import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { FieldDef } from "../auth/fields";

interface TextFieldProps {
  field: FieldDef;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export default function TextField({
  field,
  value,
  error,
  onChange
}: TextFieldProps) {
  const [revealed, setRevealed] = useState(false);
  const id = `field-${field.name}`;
  const messageId = `${id}-message`;
  const message = error ?? field.hint;
  const isPassword = field.type === "password";

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {field.label}
        {field.optional && <span className="field-optional">Optional</span>}
      </label>
      <div className="field-control">
        <input
          id={id}
          name={field.name}
          className={field.code ? "field-input is-code" : "field-input"}
          type={isPassword && revealed ? "text" : (field.type ?? "text")}
          value={value}
          placeholder={field.placeholder}
          autoComplete={field.autoComplete}
          maxLength={field.maxLength}
          spellCheck={false}
          autoCapitalize={field.code ? "characters" : "off"}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          onChange={(e) =>
            onChange(
              field.code
                ? e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                : e.target.value
            )
          }
        />
        {isPassword && (
          <button
            type="button"
            className="field-reveal"
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            onClick={() => setRevealed(!revealed)}
          >
            {revealed ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {message && (
        <p
          id={messageId}
          className={error ? "field-message is-error" : "field-message"}
        >
          {message}
        </p>
      )}
    </div>
  );
}
