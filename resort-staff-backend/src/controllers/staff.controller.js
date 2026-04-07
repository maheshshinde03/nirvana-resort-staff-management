import db from "../models/index.js";
import { Op } from "sequelize";
import { successResponse } from "../utils/apiResponse.js";

const { Staff } = db;

/**
 * ✅ Create Staff
 */
export const createStaff = async (req, res, next) => {
  try {
    const staff = await Staff.create(req.body);

    return successResponse(res, staff, "Staff created successfully");

  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return next({
        status: 400,
        message: "Mobile number already exists"
      });
    }
    next(error);
  }
};

/**
 * ✅ Get Staff List (Pagination + Search + Filters)
 */
export const getStaff = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      role,
      category,
      status
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    if (typeof category === "string" && category) {
      category = category.toUpperCase();
    }

    if (typeof status === "string" && status) {
      status = status.toUpperCase();
    }

    const where = {
      ...(search && {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { mobile: { [Op.like]: `%${search}%` } }
        ]
      }),
      ...(role && { role }),
      ...(category && { category }),
      ...(status && { status })
    };

    const { rows, count } = await Staff.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]]
    });

    return successResponse(
      res,
      {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        data: rows
      },
      "Staff fetched successfully"
    );

  } catch (error) {
    next(error);
  }
};

/**
 * ✅ Get Single Staff
 */
export const getStaffById = async (req, res, next) => {
  try {
    const staff = await Staff.findByPk(req.params.id);

    if (!staff) {
      return next({
        status: 404,
        message: "Staff not found"
      });
    }

    return successResponse(res, staff, "Staff fetched successfully");

  } catch (error) {
    next(error);
  }
};

/**
 * ✅ Update Staff
 */
export const updateStaff = async (req, res, next) => {
  try {
    const [updated] = await Staff.update(req.body, {
      where: { id: req.params.id }
    });

    if (!updated) {
      return next({
        status: 404,
        message: "Staff not found"
      });
    }

    return successResponse(res, null, "Staff updated successfully");

  } catch (error) {
    next(error);
  }
};

/**
 * ✅ Delete Staff
 */
export const deleteStaff = async (req, res, next) => {
  try {
    const deleted = await Staff.destroy({
      where: { id: req.params.id }
    });

    if (!deleted) {
      return next({
        status: 404,
        message: "Staff not found"
      });
    }

    return successResponse(res, null, "Staff deleted successfully");

  } catch (error) {
    next(error);
  }
};
