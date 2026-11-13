import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AppError } from "../errors.js";
import {
  setBattleStatus,
  startBattle,
  submitTurn
} from "../services/battles.service.js";

const router = Router();
router.use(requireAuth, requireRole("STUDENT"));

// Same fields as the Battle JSON built by public.battle_json in the database.
const BATTLE_SELECT =
  "battle_id, status, score, accuracy, player_health, enemy_health, saved_state, started_at, ended_at, challenge:challenges(level_number, type), enemy:enemies(enemy_id, name, max_health, attack_power, sprite_url), character:characters(max_health)";

function toBattleJson(row) {
  let outcome = null;
  if (row.status === "COMPLETED") {
    if (row.enemy_health === 0) outcome = "WON";
    else if (row.player_health === 0) outcome = "LOST";
  }
  return {
    battle_id: row.battle_id,
    status: row.status,
    outcome,
    level_number: row.challenge?.level_number,
    challenge_type: row.challenge?.type,
    enemy: row.enemy,
    player_health: row.player_health,
    player_max_health: row.character?.max_health,
    enemy_health: row.enemy_health,
    score: row.score,
    accuracy: row.accuracy,
    turns: row.saved_state?.turns ?? 0,
    started_at: row.started_at,
    ended_at: row.ended_at
  };
}

function parsePositiveInt(value, code) {
  const number = Number(value);
  if (
    !/^\d+$/.test(String(value)) ||
    !Number.isSafeInteger(number) ||
    number <= 0
  ) {
    throw new AppError(400, code);
  }
  return number;
}

router.post("/", async (req, res, next) => {
  try {
    const { levelNumber } = req.body || {};
    if (!Number.isInteger(levelNumber)) {
      throw new AppError(400, "invalid_level");
    }
    const battle = await startBattle(
      req.user.id,
      parsePositiveInt(levelNumber, "invalid_level")
    );
    res.status(201).json({ battle });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    // RLS limits rows to this student's own battles.
    const { data, error } = await req.supabase
      .from("battles")
      .select(BATTLE_SELECT)
      .order("started_at", { ascending: false })
      .order("battle_id", { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json({ battles: data.map(toBattleJson) });
  } catch (err) {
    next(err);
  }
});

// Must stay above "/:id" so "current" isn't parsed as an id.
router.get("/current", async (req, res, next) => {
  try {
    const { data, error } = await req.supabase
      .from("battles")
      .select(BATTLE_SELECT)
      .in("status", ["ACTIVE", "PAUSED"])
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    res.json({ battle: data ? toBattleJson(data) : null });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id, "invalid_id");
    const { data, error } = await req.supabase
      .from("battles")
      .select(BATTLE_SELECT)
      .eq("battle_id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new AppError(404, "battle_not_found");
    res.json({ battle: toBattleJson(data) });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/turns", async (req, res, next) => {
  try {
    const id = parsePositiveInt(req.params.id, "invalid_id");
    const { score, accuracy } = req.body || {};
    if (
      !Number.isInteger(score) ||
      score < 0 ||
      typeof accuracy !== "number" ||
      !Number.isFinite(accuracy) ||
      accuracy < 0 ||
      accuracy > 100
    ) {
      throw new AppError(400, "invalid_turn");
    }

    // Scores come from browser pitch grading; server-side anti-cheat is out of scope.
    const result = await submitTurn(req.user.id, id, score, accuracy);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

for (const action of ["pause", "resume", "abandon"]) {
  router.post(`/:id/${action}`, async (req, res, next) => {
    try {
      const id = parsePositiveInt(req.params.id, "invalid_id");
      const battle = await setBattleStatus(req.user.id, id, action);
      res.json({ battle });
    } catch (err) {
      next(err);
    }
  });
}

export default router;
