import type { Role } from "./roles";

export interface AuthForm {
  displayName: string;
  classCode: string;
  schoolName: string;
  linkCode: string;
  username: string;
  email: string;
  password: string;
}

export type FieldName = keyof AuthForm;
export type FieldErrors = Partial<Record<FieldName, string>>;

export const EMPTY_FORM: AuthForm = {
  displayName: "",
  classCode: "",
  schoolName: "",
  linkCode: "",
  username: "",
  email: "",
  password: ""
};

export interface FieldDef {
  name: FieldName;
  label: string;
  type?: "text" | "email" | "password";
  placeholder: string;
  autoComplete: string;
  hint?: string;
  optional?: boolean;
  code?: boolean;
  maxLength?: number;
  validate: (value: string) => string | null;
}

// Same character set as random_code() in the signup migration: no 0/O or 1/I.
const codePattern = (length: number) =>
  new RegExp(`^[A-HJ-NP-Z2-9]{${length}}$`);
const CLASS_CODE = codePattern(6);
const LINK_CODE = codePattern(8);
const USERNAME = /^[a-z0-9_]{3,20}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const required = (message: string) => (value: string) =>
  value.trim() ? null : message;

const displayName = (label: string, placeholder: string): FieldDef => ({
  name: "displayName",
  label,
  placeholder,
  autoComplete: "name",
  maxLength: 40,
  validate: required("Please enter your name.")
});

const email: FieldDef = {
  name: "email",
  label: "Email",
  type: "email",
  placeholder: "you@example.com",
  autoComplete: "email",
  validate: (v) => {
    if (!v.trim()) return "Please enter your email.";
    return EMAIL.test(v.trim()) ? null : "That doesn't look like an email.";
  }
};

const newPassword: FieldDef = {
  name: "password",
  label: "Password",
  type: "password",
  placeholder: "At least 8 characters",
  autoComplete: "new-password",
  validate: (v) =>
    v.length >= 8 ? null : "Passwords need at least 8 characters."
};

const username: FieldDef = {
  name: "username",
  label: "Username",
  placeholder: "nova_sings",
  autoComplete: "username",
  maxLength: 20,
  validate: required("Please enter your username.")
};

// Sign-up is three steps: the two field groups below, then a review step.
export const SIGNUP_STEPS: Record<Role, FieldDef[][]> = {
  student: [
    [
      displayName("Your name", "Nova"),
      {
        name: "classCode",
        label: "Class code",
        placeholder: "K7MP2Q",
        autoComplete: "off",
        hint: "Ask your teacher for your 6-character code.",
        code: true,
        maxLength: 6,
        validate: (v) => {
          if (!v) return "Please enter your class code.";
          return CLASS_CODE.test(v)
            ? null
            : "Class codes are 6 letters and numbers.";
        }
      }
    ],
    [
      {
        ...username,
        label: "Pick a username",
        hint: "3–20 letters, numbers or _. No email needed.",
        validate: (v) =>
          USERNAME.test(v.trim())
            ? null
            : "Use 3–20 letters, numbers or _ (no spaces)."
      },
      newPassword
    ]
  ],
  teacher: [
    [
      displayName("Teacher name", "Ms. Samira"),
      {
        name: "schoolName",
        label: "School or studio",
        placeholder: "Riverdale Music School",
        autoComplete: "organization",
        optional: true,
        maxLength: 80,
        validate: () => null
      }
    ],
    [email, newPassword]
  ],
  parent: [
    [
      displayName("Your name", "Alex Kim"),
      {
        name: "linkCode",
        label: "Student connection",
        placeholder: "Invite code",
        autoComplete: "off",
        hint: "Your child can find their 8-character invite code in their settings. You can add it later.",
        optional: true,
        code: true,
        maxLength: 8,
        validate: (v) =>
          !v || LINK_CODE.test(v)
            ? null
            : "Invite codes are 8 letters and numbers."
      }
    ],
    [email, newPassword]
  ]
};

const loginPassword: FieldDef = {
  ...newPassword,
  placeholder: "Your password",
  autoComplete: "current-password",
  validate: required("Please enter your password.")
};

export const LOGIN_FIELDS: Record<Role, FieldDef[]> = {
  student: [username, loginPassword],
  teacher: [email, loginPassword],
  parent: [email, loginPassword]
};

export function validateFields(fields: FieldDef[], form: AuthForm) {
  const errors: FieldErrors = {};
  for (const field of fields) {
    const error = field.validate(form[field.name]);
    if (error) errors[field.name] = error;
  }
  return errors;
}
