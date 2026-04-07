import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import staffRoutes from "./routes/staff.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));



app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check endpoint (before error handler)
app.get("/api/health", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    message: "Backend server is running"
  });
});

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("API Running...");
});

export default app;