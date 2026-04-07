import db from "../models/index.js";
import { Op } from "sequelize";
import { monthWhereIn, toMonthName } from "../utils/month.js";

const { Staff, Attendance, Salary } = db;

/**
 * ✅ Get Salary for a Staff (Month-wise)
 */
export const getSalary = async (req, res) => {
  try {
    const { staff_id, month, year } = req.query;

    if (!staff_id || !month || !year) {
      return res.status(400).json({
        message: "staff_id, month, year are required"
      });
    }

    const monthName = toMonthName(month);
    const monthIn = monthWhereIn(month);
    if (!monthName || !monthIn) {
      return res.status(400).json({ message: "Invalid month" });
    }

    // 🔍 Get Staff
    const staff = await Staff.findByPk(staff_id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // 🔍 Get Attendance
    const attendance = await Attendance.findOne({
      where: { staff_id, month: { [Op.in]: monthIn }, year }
    });

    if (!attendance) {
      return res.status(404).json({
        message: "Attendance not found for this month"
      });
    }

    // 💰 Salary Calculation (fixed 30-day basis)
    const perDaySalary = staff.salary / 30;
    const leaveDays = Number(attendance.leaves ?? 0);
    const deduction = perDaySalary * leaveDays;
    const finalSalary = perDaySalary * Number(attendance.present_days ?? 0);

    res.json({
      staff_id,
      name: staff.name,
      mobile: staff.mobile,
      role: staff.role,
      category: staff.category,
      joining_date: staff.joining_date,
      leaving_date: staff.leaving_date,
      attendance_id: attendance.id,
      basic_salary: staff.salary,
      month: monthName,
      year,
      total_days: attendance.total_days,
      present_days: attendance.present_days,
      absent_days: attendance.absent_days,
      leave_days: leaveDays,
      salary_per_day: perDaySalary,
      deduction,
      final_salary: finalSalary
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Monthly Salary Report (All Staff)
 */
export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: "month and year required"
      });
    }

    const monthName = toMonthName(month);
    const monthIn = monthWhereIn(month);
    if (!monthName || !monthIn) {
      return res.status(400).json({ message: "Invalid month" });
    }

    const records = await Attendance.findAll({
      where: { month: { [Op.in]: monthIn }, year },
      include: [
        {
          model: Staff,
          attributes: ["id", "name", "role", "salary"]
        }
      ]
    });

    const report = records.map((item) => {
      const perDaySalary = item.Staff.salary / 30;
      const finalSalary = perDaySalary * item.present_days;

      return {
        staff_id: item.staff_id,
        name: item.Staff.name,
        role: item.Staff.role,
        total_days: item.total_days,
        present_days: item.present_days,
        final_salary: finalSalary
      };
    });

    res.json({
      month: monthName,
      year,
      total_staff: report.length,
      data: report
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Save/Update Salary Record (called from attendance update)
 */
export const saveSalary = async (req, res) => {
  try {
    const {
      staff_id,
      month,
      year,
      total_days = 30,
      present_days,
      leave_days,
      status = "PENDING"
    } = req.body;

    // 🔍 Validation
    if (!staff_id || !month || !year || present_days === undefined || leave_days === undefined) {
      return res.status(400).json({
        message: "staff_id, month, year, present_days, leave_days are required"
      });
    }

    // 🔍 Get Staff
    const staff = await Staff.findByPk(staff_id);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // 💰 Salary Calculation
    const fixed_salary = staff.salary;
    const salary_per_day = fixed_salary / total_days;
    const deduction = salary_per_day * leave_days;
    const total_salary = Math.max(0, fixed_salary - deduction);

    // 🔄 Create or Update Salary Record
    const [salary, created] = await Salary.findOrCreate({
      where: { staff_id, month, year },
      defaults: {
        total_days,
        present_days,
        leave_days,
        fixed_salary,
        salary_per_day,
        deduction,
        total_salary,
        status
      }
    });

    if (!created) {
      // Update existing record
      await salary.update({
        present_days,
        leave_days,
        total_days,
        fixed_salary,
        salary_per_day,
        deduction,
        total_salary,
        status
      });
    }

    res.json({
      message: created ? "Salary record created" : "Salary record updated",
      data: salary
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Get Salary List with Filters (for salary list component)
 */
export const getSalaryList = async (req, res) => {
  try {
    const { search, month, year } = req.query;

    const whereClause = {};

    // Filter by month
    if (month) {
      const monthName = toMonthName(month);
      const monthIn = monthWhereIn(month);
      if (!monthName || !monthIn) {
        return res.status(400).json({ message: "Invalid month" });
      }
      whereClause.month = { [Op.in]: monthIn };
    }

    // Filter by year
    if (year) {
      whereClause.year = Number(year);
    }

    // 🔍 Get Salary records with Staff info
    const salaries = await Salary.findAll({
      where: whereClause,
      include: [
        {
          model: Staff,
          attributes: ["id", "staff_id", "name", "role", "category", "salary"]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    // Filter by search (staff name)
    let filteredSalaries = salaries;
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      filteredSalaries = salaries.filter((s) =>
        s.Staff?.name?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      total: filteredSalaries.length,
      data: filteredSalaries.map((s) => ({
        id: s.id,
        staff_id: s.staff_id,
        staff_name: s.Staff?.name,
        staff_enterprise_id: s.Staff?.staff_id,
        role: s.Staff?.role,
        category: s.Staff?.category,
        month: s.month,
        year: s.year,
        total_days: s.total_days,
        present_days: s.present_days,
        leave_days: s.leave_days,
        fixed_salary: s.fixed_salary,
        salary_per_day: s.salary_per_day,
        deduction: s.deduction,
        total_salary: s.total_salary,
        status: s.status,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt
      }))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
