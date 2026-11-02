import { adminSupabase } from "../db/supabase.js";
import { AppError } from "../errors.js";

export async function getStudentProgress(studentId) {
  const { data: character, error: characterError } = await adminSupabase
    .from("characters")
    .select("level, xp")
    .eq("student_id", studentId)
    .maybeSingle();
  if (characterError) throw characterError;
  if (!character) throw new AppError(404, "student_not_found");

  const { data: report, error: reportError } = await adminSupabase
    .from("student_reports")
    .select("report_id")
    .eq("student_id", studentId)
    .maybeSingle();
  if (reportError) throw reportError;
  if (!report) throw new AppError(404, "student_not_found");

  const { data: progress, error: progressError } = await adminSupabase
    .from("level_progress")
    .select("challenge_id, best_score, best_accuracy, attempts, completed")
    .eq("student_report_id", report.report_id);
  if (progressError) throw progressError;

  const progressByChallengeId = {};
  for (const item of progress) {
    progressByChallengeId[item.challenge_id] = {
      best_score: item.best_score,
      best_accuracy: item.best_accuracy,
      attempts: item.attempts,
      completed: item.completed
    };
  }

  return {
    character: { level: character.level, xp: character.xp },
    progressByChallengeId
  };
}

export async function recordAttempt(studentId, levelNumber, score, accuracy) {
  const { data, error } = await adminSupabase.rpc("record_level_attempt", {
    p_student_id: studentId,
    p_level_number: levelNumber,
    p_score: score,
    p_accuracy: accuracy
  });
  if (error) {
    if (error.message.includes("level_not_found")) {
      throw new AppError(404, "level_not_found");
    }
    if (error.message.includes("level_locked")) {
      throw new AppError(403, "level_locked");
    }
    if (error.message.includes("invalid_attempt")) {
      throw new AppError(400, "invalid_attempt");
    }
    if (error.message.includes("student_not_found")) {
      throw new AppError(404, "student_not_found");
    }
    console.error(error);
    throw new AppError(500, "attempt_failed");
  }
  return data;
}
