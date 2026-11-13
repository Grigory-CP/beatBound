import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import classroomRoutes from "./routes/classrooms.routes.js";
import levelsRoutes from "./routes/levels.routes.js";
import battlesRoutes from "./routes/battles.routes.js";
import { errorHandler } from "./errors.js";

// The Express app without app.listen(), so tests can import it and send
// requests with Supertest without opening a port. server.js starts it.
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/levels", levelsRoutes);
app.use("/api/battles", battlesRoutes);

app.use((req, res) => res.status(404).json({ error: "not_found" }));
app.use(errorHandler);

export default app;
