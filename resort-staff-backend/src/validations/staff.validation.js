import Joi from "joi";

export const createStaffSchema = Joi.object({
  name: Joi.string().required(),
  mobile: Joi.string().length(10).required(),
  address: Joi.string().optional().allow(''),
  role: Joi.string().required(),
  category: Joi.string().valid("FULL_TIME", "PART_TIME", "CONTRACT").required(),
  salary: Joi.number().required(),
  joining_date: Joi.date().required(),
  leaving_date: Joi.date().allow(null),
  status: Joi.string().valid("ACTIVE", "INACTIVE").optional()
}).when(Joi.object({ status: Joi.valid("INACTIVE") }).unknown(), {
  then: Joi.object({
    leaving_date: Joi.date().required()
  })
});
