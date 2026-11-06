import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import SubmitButton from "../components/SubmitButton";
import TextField from "../components/TextField";
import { login, mapAuthError } from "../auth/api";
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
  const [formError, setFormError] = useState<string>("");
  const [busy, setBusy] = useState(false);

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
      setFormError("");
      document.getElementById(`field-${first}`)?.focus();
      return;
    }

    setBusy(true);
    setFormError("");
    try {
      await login(role, form);
      navigate("/home");
    } catch (error) {
      const { form, ...fieldErrors } = mapAuthError(role, error);
      setErrors(fieldErrors);
      setFormError(form ?? "");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      role={role}
      heading={heading}
      subheading={subheading}
      onBack={() => navigate(`/signup/${role}`)}
    >
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
        {formError && (
          <p className="auth-form-alert" role="alert">
            {formError}
          </p>
        )}
        <SubmitButton busy={busy}>Log in</SubmitButton>
      </form>
      <p className="auth-switch">
        New to beatBound? <Link to={`/signup/${role}`}>Create an account</Link>
      </p>
    </AuthLayout>
  );
}
