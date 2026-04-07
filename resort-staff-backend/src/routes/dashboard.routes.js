import express from "express";
import {
  getStats,
  getMonthlySalary,
  getAttendanceSummary,
} from "../controllers/dashboard.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 🔐 Protected
router.use(verifyToken);

router.get("/stats", getStats);
router.get("/salary-monthly", getMonthlySalary);
router.get("/attendance-summary", getAttendanceSummary);

export default router;
