import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AppError } from "../errors.js";

const router = Router();
router.use(requireAuth, requireRole("TEACHER"));

router.post("/", async (req, res, next) => {
  try {
    const name = req.body?.name?.trim();
    if (!name) throw new AppError(400, "missing_field", "name is required");
    const { data, error } = await supabase.rpc("create_classroom", {
      p_teacher_id: req.user.id,
      p_name: name
    });
    if (error) throw error;
    res.status(201).json({ classroom: data[0] });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("classrooms")
      .select("class_id, name, class_code, is_active, created_at")
      .eq("teacher_id", req.user.id)
      .order("created_at");
    if (error) throw error;
    res.json({ classrooms: data });
  } catch (err) {
    next(err);
  }
});

export default router;
