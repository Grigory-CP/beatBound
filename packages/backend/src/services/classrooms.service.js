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

export async function getRoster(classId) {
  const { data, error } = await adminSupabase
    .from("students")
    .select(
      "user_id, username, user:users!students_user_id_fkey(display_name), character:characters!characters_student_id_fkey(level, xp), report:student_reports!student_reports_student_id_fkey(total_score, battles_played, battles_won, average_accuracy)"
    )
    .eq("classroom_id", classId);
  if (error) throw error;

  return data
    .map((student) => ({
      user_id: student.user_id,
      username: student.username,
      display_name: student.user?.display_name,
      level: student.character?.level,
      xp: student.character?.xp,
      total_score: student.report?.total_score,
      battles_played: student.report?.battles_played,
      battles_won: student.report?.battles_won,
      average_accuracy: student.report?.average_accuracy
    }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
}

export async function getStudentClassroom(studentId) {
  const { data: student, error: studentError } = await adminSupabase
    .from("students")
    .select("classroom_id")
    .eq("user_id", studentId)
    .maybeSingle();
  if (studentError) throw studentError;
  if (!student) throw new AppError(404, "classroom_not_found");

  const { data: classroom, error: classroomError } = await adminSupabase
    .from("classrooms")
    .select("class_id, name, teacher_id")
    .eq("class_id", student.classroom_id)
    .maybeSingle();
  if (classroomError) throw classroomError;
  if (!classroom) throw new AppError(404, "classroom_not_found");

  const { data: teacher, error: teacherError } = await adminSupabase
    .from("users")
    .select("display_name")
    .eq("user_id", classroom.teacher_id)
    .maybeSingle();
  if (teacherError) throw teacherError;
  if (!teacher) throw new AppError(404, "classroom_not_found");

  return {
    class_id: classroom.class_id,
    name: classroom.name,
    teacher_name: teacher.display_name
  };
}
