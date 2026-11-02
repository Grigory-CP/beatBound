import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AppError } from "../errors.js";
import {
  getStudentProgress,
  recordAttempt
} from "../services/levels.service.js";

const router = Router();
router.use(requireAuth);

function parseLevelNumber(value) {
  const levelNumber = Number(value);
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(levelNumber) ||
    levelNumber <= 0
  ) {
    throw new AppError(400, "invalid_level");
  }
  return levelNumber;
}

router.get("/", async (req, res, next) => {
  try {
    const { data: challenges, error } = await req.supabase
      .from("challenges")
      .select(
        "challenge_id, type, title, level_number, difficulty, unlock_level, xp_reward"
      )
      .order("level_number");
    if (error) throw error;

    if (req.user.role === "STUDENT") {
      const progress = await getStudentProgress(req.user.id);
      const levels = challenges.map((challenge) => {
        const stats = progress.progressByChallengeId[challenge.challenge_id];
        return {
          ...challenge,
          unlocked: challenge.unlock_level <= progress.character.level,
          completed: stats?.completed ?? false,
          best_score: stats?.best_score ?? 0,
          best_accuracy: stats?.best_accuracy ?? 0,
          attempts: stats?.attempts ?? 0
        };
      });
      return res.json({ levels, character: progress.character });
    }

    res.json({ levels: challenges });
  } catch (err) {
    next(err);
  }
});

router.get("/:levelNumber", async (req, res, next) => {
  try {
    const levelNumber = parseLevelNumber(req.params.levelNumber);
    const { data: challenge, error } = await req.supabase
      .from("challenges")
      .select(
        "challenge_id, type, title, level_number, difficulty, unlock_level, xp_reward"
      )
      .eq("level_number", levelNumber)
      .maybeSingle();
    if (error) throw error;
    if (!challenge) throw new AppError(404, "level_not_found");

    if (req.user.role === "STUDENT") {
      const progress = await getStudentProgress(req.user.id);
      if (challenge.unlock_level > progress.character.level) {
        throw new AppError(403, "level_locked");
      }
    }

    const configTable =
      challenge.type === "PITCH" ? "pitch_challenges" : "rhythm_challenges";
    const { data: config, error: configError } = await req.supabase
      .from(configTable)
      .select("*")
      .eq("challenge_id", challenge.challenge_id)
      .maybeSingle();
    if (configError) throw configError;
    if (!config) throw new AppError(404, "level_not_found");

    res.json({ ...challenge, config });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:levelNumber/attempts",
  requireRole("STUDENT"),
  async (req, res, next) => {
    try {
      const levelNumber = parseLevelNumber(req.params.levelNumber);
      const { score, accuracy } = req.body || {};
      if (
        !Number.isInteger(score) ||
        score < 0 ||
        typeof accuracy !== "number" ||
        accuracy < 0 ||
        accuracy > 100
      ) {
        throw new AppError(400, "invalid_attempt");
      }

      // Scores come from browser pitch grading; server-side anti-cheat is out of scope.
      const result = await recordAttempt(
        req.user.id,
        levelNumber,
        score,
        accuracy
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
