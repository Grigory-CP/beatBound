import { adminSupabase } from "../db/supabase.js";
import { AppError } from "../errors.js";

const KNOWN_ERRORS = [
  ["level_not_found", 404],
  ["level_locked", 403],
  ["student_not_found", 404],
  ["battle_not_found", 404],
  ["battle_not_active", 409],
  ["invalid_turn", 400],
  ["invalid_action", 400]
];

async function callBattleRpc(name, params) {
  const { data, error } = await adminSupabase.rpc(name, params);
  if (error) {
    const known = KNOWN_ERRORS.find(([code]) => error.message.includes(code));
    if (known) throw new AppError(known[1], known[0]);
    console.error(error);
    throw new AppError(500, "battle_failed");
  }
  return data;
}

export function startBattle(studentId, levelNumber) {
  return callBattleRpc("start_battle", {
    p_student_id: studentId,
    p_level_number: levelNumber
  });
}

export function submitTurn(studentId, battleId, score, accuracy) {
  return callBattleRpc("submit_battle_turn", {
    p_student_id: studentId,
    p_battle_id: battleId,
    p_score: score,
    p_accuracy: accuracy
  });
}

export function setBattleStatus(studentId, battleId, action) {
  return callBattleRpc("set_battle_status", {
    p_student_id: studentId,
    p_battle_id: battleId,
    p_action: action
  });
}
