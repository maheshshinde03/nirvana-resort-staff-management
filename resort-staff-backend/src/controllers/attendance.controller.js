import db from "../models/index.js";
import { Op } from "sequelize";
import { successResponse } from "../utils/apiResponse.js";
import { monthWhereIn, toMonthName, toMonthNumber } from "../utils/month.js";

const { Attendance, Staff } = db;

/**
 * ✅ Mark Attendance
 */
export const markAttendance = async (req, res) => {
  try {
    const {
      staff_id,
      month,
      year,
      total_days,
      present_days,
      leaves = 0,
      leave_reason
    } = req.body;

    const monthName = toMonthName(month);
    const monthIn = monthWhereIn(month);
    const monthNum = toMonthNumber(month);
    if (!monthName || !monthIn) {
      return res.status(400).json({ message: "Invalid month" });
    }

    // Find staff by id (database primary key), not by enterprise staff_id
    const staff = await Staff.findByPk(staff_id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (String(staff.status || "").toUpperCase() !== "ACTIVE") {
      return res.status(400).json({ message: "Attendance can be marked only for active staff" });
    }

    if (staff.joining_date && monthNum) {
      const join = new Date(staff.joining_date);
      const joinYear = join.getFullYear();
      const joinMonth = join.getMonth() + 1;

      if (Number(year) < joinYear || (Number(year) === joinYear && monthNum < joinMonth)) {
        return res.status(400).json({ message: "Cannot mark attendance before staff joining date" });
      }
    }

    // 🔒 Attendance submission policy: Only allow current month (if last day) or previous months
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

    const submittedYear = Number(year);
    const submittedMonth = monthNum;

    // Cannot submit for future months/years
    if (submittedYear > currentYear || (submittedYear === currentYear && submittedMonth > currentMonth)) {
      return res.status(400).json({ 
        message: "Cannot mark attendance for future months" 
      });
    }

    // Current month: Only allow if today is the last day of the month
    if (submittedYear === currentYear && submittedMonth === currentMonth) {
      if (currentDate !== lastDayOfMonth) {
        return res.status(400).json({ 
          message: `Attendance for current month can only be marked on the last day (${lastDayOfMonth}) of the month` 
        });
      }
    }

    // 🔍 Validation
    if (present_days > total_days) {
      return res.status(400).json({
        message: "Present days cannot be greater than total days"
      });
    }

    if (Number(present_days) + Number(leaves) > Number(total_days)) {
      return res.status(400).json({
        message: "Present days + leave days cannot be greater than total days"
      });
    }

    // 🚫 Prevent duplicates across legacy numeric months and new month names
    const existing = await Attendance.findOne({
      where: { staff_id, year, month: { [Op.in]: monthIn } }
    });
    if (existing) {
      return res.status(400).json({
        message: "Attendance already exists for this staff and month"
      });
    }

    const absent_days = Number(total_days) - Number(present_days) - Number(leaves);

    const record = await Attendance.create({
      staff_id,
      month: monthName,
      year,
      total_days,
      present_days,
      absent_days,
      leaves: Number(leaves) || 0,
      leave_reason
    });

    return successResponse(res, record, "Attendance marked successfully", 201);

  } catch (error) {
    // 🚫 Duplicate prevention
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        message: "Attendance already exists for this staff and month"
      });
    }

    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Get Attendance List (with filters)
 */
export const getAttendance = async (req, res) => {
  try {
    let { month, year, staff_id, search = "", page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const offset = (page - 1) * limit;

    const where = {};

    if (month) {
      const monthIn = monthWhereIn(month);
      where.month = monthIn ? { [Op.in]: monthIn } : month;
    }

    if (year) where.year = year;
    if (staff_id) where.staff_id = staff_id;

    const staffWhere = search
      ? { name: { [Op.like]: `%${search}%` } }
      : undefined;

    const { rows, count } = await Attendance.findAndCountAll({
      where,
      include: [
        {
          model: Staff,
          attributes: ["id", "name", "role", "salary"],
          ...(staffWhere ? { where: staffWhere, required: true } : {})
        }
      ],
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
      "Attendance fetched successfully"
    );

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Update Attendance
 */
export const updateAttendance = async (req, res) => {
  try {
    const { total_days, present_days, leaves = 0 } = req.body;

    if (present_days > total_days) {
      return res.status(400).json({
        message: "Invalid attendance values"
      });
    }

    if (Number(present_days) + Number(leaves) > Number(total_days)) {
      return res.status(400).json({
        message: "Invalid attendance values"
      });
    }

    const absent_days = Number(total_days) - Number(present_days) - Number(leaves);

    const updateBody = { ...req.body, absent_days };
    if (updateBody.month !== undefined) {
      const monthName = toMonthName(updateBody.month);
      if (!monthName) {
        return res.status(400).json({ message: "Invalid month" });
      }
      updateBody.month = monthName;
    }

    const [updated] = await Attendance.update(
      updateBody,
      { where: { id: req.params.id } }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Attendance not found"
      });
    }

    return successResponse(res, null, "Attendance updated successfully");

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Delete Attendance
 */
export const deleteAttendance = async (req, res) => {
  try {
    const deleted = await Attendance.destroy({
      where: { id: req.params.id }
    });

    if (!deleted) {
      return res.status(404).json({
        message: "Attendance not found"
      });
    }

    return successResponse(res, null, "Attendance deleted successfully");

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
