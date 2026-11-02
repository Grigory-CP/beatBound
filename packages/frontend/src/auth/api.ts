import type { AuthForm } from "./fields";
import type { Role } from "./roles";

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

// Frontend-only for now: these log the request they would send and resolve
// after a short delay. Swap in fetch(..., { credentials: "include" }) calls to
// POST /api/auth/signup/:role and /api/auth/login when wiring up the backend.
// A parent's invite code will go to POST /api/parents/link after sign-up.
const fakeLatency = () => new Promise((resolve) => setTimeout(resolve, 700));

function logMock(path: string, body: { password: string }) {
  console.info(`[mock] POST ${path}`, { ...body, password: "********" });
}

export async function signup(role: Role, form: AuthForm) {
  logMock(`/api/auth/signup/${role}`, signupBody(role, form));
  await fakeLatency();
}

export async function login(role: Role, form: AuthForm) {
  logMock("/api/auth/login", loginBody(role, form));
  await fakeLatency();
}
