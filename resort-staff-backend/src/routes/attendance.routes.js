import express from "express";
import {
  markAttendance,
  getAttendance,
  updateAttendance,
  deleteAttendance
} from "../controllers/attendance.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { attendanceSchema } from "../validations/attendance.validation.js";
import { normalizeAttendanceBody } from "../middlewares/normalizeAttendance.middleware.js";

const router = express.Router();

// 🔐 Protected
router.use(verifyToken);

//router.post("/", markAttendance);
router.post("/", normalizeAttendanceBody, validate(attendanceSchema), markAttendance);
router.get("/", getAttendance);
router.put("/:id", normalizeAttendanceBody, updateAttendance);
router.delete("/:id", deleteAttendance);

export default router;
