import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import DoneMessage from "../components/DoneMessage";
import SubmitButton from "../components/SubmitButton";
import TextField from "../components/TextField";
import { login } from "../auth/api";
import {
  EMPTY_FORM,
  LOGIN_FIELDS,
  validateFields,
  type AuthForm,
  type FieldErrors,
  type FieldName
} from "../auth/fields";
import { ROLE_CONFIG, type Role } from "../auth/roles";

interface LoginProps {
  role: Role;
}

export default function Login({ role }: LoginProps) {
  const navigate = useNavigate();
  const fields = LOGIN_FIELDS[role];
  const { heading, subheading } = ROLE_CONFIG[role].login;
  const [form, setForm] = useState<AuthForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function update(name: FieldName, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateFields(fields, form);
    const first = Object.keys(found)[0];
    if (first) {
      setErrors(found);
      document.getElementById(`field-${first}`)?.focus();
      return;
    }
    setBusy(true);
    await login(role, form);
    setBusy(false);
    setDone(true);
  }

  return (
    <AuthLayout
      role={role}
      heading={done ? "You're logged in!" : heading}
      subheading={done ? "Great to see you again." : subheading}
      onBack={() => navigate(done ? "/" : `/signup/${role}`)}
    >
      {done ? (
        <DoneMessage message="Your home page is on its way. Check back soon!" />
      ) : (
        <>
          <form className="auth-form" noValidate onSubmit={handleSubmit}>
            {fields.map((field) => (
              <TextField
                key={field.name}
                field={field}
                value={form[field.name]}
                error={errors[field.name]}
                onChange={(value) => update(field.name, value)}
              />
            ))}
            <SubmitButton busy={busy}>Log in</SubmitButton>
          </form>
          <p className="auth-switch">
            New to beatBound?{" "}
            <Link to={`/signup/${role}`}>Create an account</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
