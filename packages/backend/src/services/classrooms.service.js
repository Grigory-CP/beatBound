import { adminSupabase } from "../db/supabase.js";
import { AppError } from "../errors.js";

export async function createClassroom(teacherId, name) {
  const { data, error } = await adminSupabase.rpc("create_classroom", {
    p_teacher_id: teacherId,
    p_name: name
  });
  if (error) {
    console.error(error);
    throw new AppError(500, "server_error", "Something went wrong");
  }
  return data[0];
}
