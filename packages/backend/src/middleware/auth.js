import { userFromToken } from "../services/auth.service.js";
import { createUserClient } from "../db/supabase.js";
import { AppError } from "../errors.js";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token =
      req.cookies?.bb_access ||
      (header?.startsWith("Bearer ") ? header.slice(7) : null);
    if (!token) throw new AppError(401, "unauthorized");
    req.user = await userFromToken(token);
    req.supabase = createUserClient(token);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return next(
        new AppError(403, "forbidden", "You can't do that with this account")
      );
    }
    next();
  };
}
