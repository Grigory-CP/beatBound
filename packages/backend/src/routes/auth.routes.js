import { Router } from "express";
import * as auth from "../services/auth.service.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const isProd = process.env.NODE_ENV === "production";

function setSessionCookies(res, session) {
  const base = { httpOnly: true, sameSite: "lax", secure: isProd, path: "/" };
  res.cookie("bb_access", session.access_token, { ...base, maxAge: session.expires_in * 1000 });
  res.cookie("bb_refresh", session.refresh_token, { ...base, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

const handle = (fn) => (req, res, next) => fn(req, res).catch(next);

const startSession = (signupOrLogin) =>
  handle(async (req, res) => {
    const session = await signupOrLogin(req.body);
    setSessionCookies(res, session);
    const user = await auth.userFromToken(session.access_token);
    res.status(200).json({ user });
  });

router.post("/signup/student", startSession(auth.signupStudent));
router.post("/signup/teacher", startSession(auth.signupTeacher));
router.post("/signup/parent", startSession(auth.signupParent));
router.post("/login", startSession(auth.login));

router.post(
  "/refresh",
  handle(async (req, res) => {
    const session = await auth.refresh(req.cookies?.bb_refresh);
    setSessionCookies(res, session);
    res.json({ ok: true });
  })
);

router.post("/logout", (req, res) => {
  res.clearCookie("bb_access", { path: "/" });
  res.clearCookie("bb_refresh", { path: "/" });
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));

export default router;
