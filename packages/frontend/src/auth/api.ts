import type { AuthForm, FieldErrors } from "./fields";
import type { Role } from "./roles";
import { ApiError, apiFetch } from "../api/client";

export interface UserProfile {
  id: string;
  role: string;
  displayName: string;
}

// Request bodies for the backend auth endpoints (SRD section 5.1).
export function signupBody(role: Role, form: AuthForm) {
  const displayName = form.displayName.trim();
  switch (role) {
    case "student":
      return {
        username: form.username.trim().toLowerCase(),
        password: form.password,
        displayName,
        classCode: form.classCode
      };
    case "teacher":
      return {
        email: form.email.trim(),
        password: form.password,
        displayName,
        schoolName: form.schoolName.trim() || undefined
      };
    case "parent":
      return { email: form.email.trim(), password: form.password, displayName };
  }
}

export function loginBody(role: Role, form: AuthForm) {
  const identifier = role === "student" ? form.username : form.email;
  return { identifier: identifier.trim(), password: form.password };
}

export function mapAuthError(
  role: Role,
  error: unknown
): FieldErrors & { form?: string } {
  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError(0, "network_error", "Can't reach the server.");

  if (apiError.code === "invalid_class_code") {
    return { classCode: "We couldn't find that class code." };
  }
  if (apiError.code === "account_exists") {
    return {
      [role === "student" ? "username" : "email"]:
        "That account already exists. Try logging in."
    } as FieldErrors & { form?: string };
  }
  if (apiError.code === "invalid_username") {
    return { username: "Use 3–20 letters, numbers or _." };
  }
  if (apiError.code === "invalid_login") {
    return { password: "Wrong username/email or password." };
  }
  if (
    apiError.code === "missing_field" ||
    apiError.code === "missing_fields" ||
    apiError.status === 400
  ) {
    return { form: "Please check the required details and try again." };
  }
  if (apiError.code === "network_error" || apiError.status >= 500) {
    return { form: "Something went wrong. Please try again." };
  }

  return { form: "Something went wrong. Please try again." };
}

export async function signup(
  role: Role,
  form: AuthForm
): Promise<{ user: UserProfile }> {
  return apiFetch<{ user: UserProfile }>(`/api/auth/signup/${role}`, {
    method: "POST",
    body: JSON.stringify(signupBody(role, form))
  });
}

export async function login(
  role: Role,
  form: AuthForm
): Promise<{ user: UserProfile }> {
  return apiFetch<{ user: UserProfile }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(loginBody(role, form))
  });
}

export async function me(): Promise<{ user: UserProfile }> {
  return apiFetch<{ user: UserProfile }>("/api/auth/me");
}

export async function logout(): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>("/api/auth/logout", {
    method: "POST"
  });
}
