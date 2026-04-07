import Joi from "joi";
import { MONTH_NAMES } from "../utils/month.js";

export const attendanceSchema = Joi.object({
  staff_id: Joi.number().required(),
  month: Joi.alternatives()
    .try(
      Joi.number().integer().min(1).max(12),
      Joi.string().valid(...MONTH_NAMES)
    )
    .required(),
  year: Joi.number().required(),
  total_days: Joi.number().required(),
  present_days: Joi.number().required(),
  leaves: Joi.number().default(0),
  leave_reason: Joi.string().trim().allow("").optional()
});
