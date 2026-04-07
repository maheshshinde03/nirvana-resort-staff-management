import express from "express";
import {
  getSalary,
  getMonthlyReport,
  saveSalary,
  getSalaryList
} from "../controllers/salary.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 🔐 Protected
router.use(verifyToken);

router.post("/save", saveSalary);
router.get("/list", getSalaryList);
router.get("/report", getMonthlyReport);
router.get("/", getSalary);

export default router;