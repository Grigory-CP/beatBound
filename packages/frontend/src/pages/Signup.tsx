import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import DoneMessage from "../components/DoneMessage";
import StepProgress from "../components/StepProgress";
import SubmitButton from "../components/SubmitButton";
import TextField from "../components/TextField";
import { signup } from "../auth/api";
import {
  EMPTY_FORM,
  SIGNUP_STEPS,
  validateFields,
  type AuthForm,
  type FieldErrors,
  type FieldName
} from "../auth/fields";
import { ROLE_CONFIG, type Role } from "../auth/roles";

interface SignupProps {
  role: Role;
}

export default function Signup({ role }: SignupProps) {
  const navigate = useNavigate();
  const groups = SIGNUP_STEPS[role];
  const { heading, subheading } = ROLE_CONFIG[role].signup;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AuthForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const isReview = step === groups.length;

  // Move keyboard focus to the new step's first field.
  useEffect(() => {
    if (step > 0)
      document.querySelector<HTMLElement>(".auth-form input")?.focus();
  }, [step]);

  function update(name: FieldName, value: string) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isReview) {
      const found = validateFields(groups[step], form);
      const first = Object.keys(found)[0];
      if (first) {
        setErrors(found);
        document.getElementById(`field-${first}`)?.focus();
        return;
      }
      setStep(step + 1);
      return;
    }
    setBusy(true);
    await signup(role, form);
    setBusy(false);
    setDone(true);
  }

  function goBack() {
    if (step > 0 && !done) setStep(step - 1);
    else navigate("/");
  }

  if (done) {
    return (
      <AuthLayout
        role={role}
        heading={`You're all set, ${form.displayName.trim()}!`}
        subheading="Your account is ready."
        onBack={() => navigate("/")}
      >
        <DoneMessage message="Your home page is on its way. Check back soon!" />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      role={role}
      heading={isReview ? "Does this look right?" : heading}
      subheading={
        isReview
          ? "Check your details before we create your account."
          : subheading
      }
      onBack={goBack}
    >
      <StepProgress step={step} total={groups.length + 1} />
      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        {isReview ? (
          <dl className="review">
            {groups.flatMap((fields, groupIndex) =>
              fields.map((field) => (
                <div className="review-row" key={field.name}>
                  <dt>{field.label}</dt>
                  <dd>
                    {field.type === "password"
                      ? "•".repeat(form.password.length)
                      : form[field.name].trim() || (
                          <span className="review-empty">Not added</span>
                        )}
                  </dd>
                  <button
                    type="button"
                    className="review-edit"
                    aria-label={`Edit ${field.label}`}
                    onClick={() => setStep(groupIndex)}
                  >
                    Edit
                  </button>
                </div>
              ))
            )}
          </dl>
        ) : (
          groups[step].map((field) => (
            <TextField
              key={field.name}
              field={field}
              value={form[field.name]}
              error={errors[field.name]}
              onChange={(value) => update(field.name, value)}
            />
          ))
        )}
        <SubmitButton busy={busy}>
          {isReview ? "Create account" : "Continue"}
        </SubmitButton>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to={`/login/${role}`}>Log in</Link>
      </p>
    </AuthLayout>
  );
}
