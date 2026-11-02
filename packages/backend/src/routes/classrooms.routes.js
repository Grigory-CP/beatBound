import { Router } from "express";
import {
  createClassroom,
  getRoster,
  getStudentClassroom
} from "../services/classrooms.service.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { AppError } from "../errors.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    try {
      const name = req.body?.name?.trim();
      if (!name) throw new AppError(400, "missing_field", "name is required");
      const classroom = await createClassroom(req.user.id, name);
      res.status(201).json({ classroom });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/", requireAuth, requireRole("TEACHER"), async (req, res, next) => {
  try {
    // RLS is the real guard; this filter is defense in depth.
    const { data, error } = await req.supabase
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

router.get(
  "/mine",
  requireAuth,
  requireRole("STUDENT"),
  async (req, res, next) => {
    try {
      const classroom = await getStudentClassroom(req.user.id);
      res.json({ classroom });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (
        !/^\d+$/.test(req.params.id) ||
        !Number.isSafeInteger(id) ||
        id <= 0
      ) {
        throw new AppError(400, "invalid_id");
      }

      const { data: classroom, error } = await req.supabase
        .from("classrooms")
        .select("class_id, name, class_code, is_active, created_at")
        .eq("class_id", id)
        .maybeSingle();
      if (error) throw error;
      if (!classroom) throw new AppError(404, "classroom_not_found");

      const students = await getRoster(id);
      res.json({ classroom, students });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("TEACHER"),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (
        !/^\d+$/.test(req.params.id) ||
        !Number.isSafeInteger(id) ||
        id <= 0
      ) {
        throw new AppError(400, "invalid_id");
      }

      const fields = {};
      if (
        typeof req.body?.name === "string" &&
        req.body.name.trim().length >= 1 &&
        req.body.name.trim().length <= 60
      ) {
        fields.name = req.body.name.trim();
      }
      if (typeof req.body?.is_active === "boolean") {
        fields.is_active = req.body.is_active;
      }
      if (Object.keys(fields).length === 0) {
        throw new AppError(400, "invalid_fields");
      }

      const { data: classroom, error } = await req.supabase
        .from("classrooms")
        .update(fields)
        .eq("class_id", id)
        .select("class_id, name, class_code, is_active, created_at")
        .maybeSingle();
      if (error) throw error;
      if (!classroom) throw new AppError(404, "classroom_not_found");

      res.json({ classroom });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
