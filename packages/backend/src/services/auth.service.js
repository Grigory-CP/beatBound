import { supabase, newAuthClient } from "../db/supabase.js";
import { AppError } from "../errors.js";

const STUDENT_EMAIL_DOMAIN = process.env.STUDENT_EMAIL_DOMAIN || "students.beatbound.app";
const studentEmail = (username) => `${username.toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;

function requireFields(fields, body) {
  for (const f of fields) {
    if (!body[f] || typeof body[f] !== "string" || !body[f].trim()) {
      throw new AppError(400, "missing_field", `${f} is required`);
    }
  }
}

function checkPassword(password) {
  if (password.length < 8) {
    throw new AppError(400, "weak_password", "Password must be at least 8 characters");
  }
}

async function createAccount(email, password, createProfile) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (error) {
    if (/already/i.test(error.message)) {
      throw new AppError(409, "account_exists", "That username or email is taken");
    }
    throw new AppError(400, "signup_failed", error.message);
  }
  const userId = data.user.id;
  const { error: profileError } = await createProfile(userId);
  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    if (profileError.message.includes("invalid_class_code")) {
      throw new AppError(400, "invalid_class_code", "That class code doesn't exist");
    }
    if (profileError.message.includes("username")) {
      throw new AppError(400, "invalid_username", "Usernames are 3-20 letters, numbers or _");
    }
    throw new AppError(400, "signup_failed", profileError.message);
  }
  return login({ identifier: email, password });
}

export async function signupStudent(body) {
  requireFields(["username", "password", "displayName", "classCode"], body);
  checkPassword(body.password);
  const username = body.username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    throw new AppError(400, "invalid_username", "Usernames are 3-20 letters, numbers or _");
  }
  return createAccount(studentEmail(username), body.password, (userId) =>
    supabase.rpc("create_student_profile", {
      p_user_id: userId,
      p_username: username,
      p_display_name: body.displayName.trim(),
      p_class_code: body.classCode
    })
  );
}

export async function signupTeacher(body) {
  requireFields(["email", "password", "displayName"], body);
  checkPassword(body.password);
  const email = body.email.trim().toLowerCase();
  return createAccount(email, body.password, (userId) =>
    supabase.rpc("create_teacher_profile", {
      p_user_id: userId,
      p_display_name: body.displayName.trim(),
      p_email: email,
      p_school_name: body.schoolName?.trim() || null
    })
  );
}

export async function signupParent(body) {
  requireFields(["email", "password", "displayName"], body);
  checkPassword(body.password);
  const email = body.email.trim().toLowerCase();
  return createAccount(email, body.password, (userId) =>
    supabase.rpc("create_parent_profile", {
      p_user_id: userId,
      p_display_name: body.displayName.trim(),
      p_email: email
    })
  );
}

export async function login(body) {
  requireFields(["identifier", "password"], body);
  const id = body.identifier.trim();
  const email = id.includes("@") ? id.toLowerCase() : studentEmail(id);
  const { data, error } = await newAuthClient().auth.signInWithPassword({
    email,
    password: body.password
  });
  if (error) {
    throw new AppError(401, "invalid_login", "Wrong username/email or password");
  }
  return data.session;
}

export async function refresh(refreshToken) {
  if (!refreshToken) throw new AppError(401, "not_logged_in");
  const { data, error } = await newAuthClient().auth.refreshSession({
    refresh_token: refreshToken
  });
  if (error || !data.session) throw new AppError(401, "session_expired");
  return data.session;
}

export async function userFromToken(accessToken) {
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) throw new AppError(401, "session_expired");
  const { data: profile, error: dbError } = await supabase
    .from("users")
    .select("role, display_name")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (dbError) throw dbError;
  if (!profile) throw new AppError(401, "no_profile");
  return { id: data.user.id, role: profile.role, displayName: profile.display_name };
}
