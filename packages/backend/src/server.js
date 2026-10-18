import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import classroomRoutes from "./routes/classrooms.routes.js";
import { errorHandler } from "./errors.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);

app.use((req, res) => res.status(404).json({ error: "not_found" }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`beatBound API on http://localhost:${PORT}`));
