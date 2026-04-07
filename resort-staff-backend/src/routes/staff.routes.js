import express from "express";
import {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff,
  deleteStaff
} from "../controllers/staff.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { normalizeStaffBody } from "../middlewares/normalizeStaff.middleware.js";
import { createStaffSchema } from "../validations/staff.validation.js";

const router = express.Router();

// 🔐 All routes protected
router.use(verifyToken);

// CRUD
//router.post("/", createStaff);
router.post("/", normalizeStaffBody, validate(createStaffSchema), createStaff);
router.get("/", getStaff);
router.get("/:id", getStaffById);
router.put("/:id", normalizeStaffBody, updateStaff);
router.delete("/:id", deleteStaff);

export default router;
