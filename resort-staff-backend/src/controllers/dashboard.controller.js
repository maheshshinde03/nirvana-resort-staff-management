import db from "../models/index.js";
import { Op } from "sequelize";
import { monthWhereIn } from "../utils/month.js";

const { Staff, Attendance } = db;

export const getStats = async (req, res) => {
  const totalStaff = await Staff.count();
  const activeStaff = await Staff.count({ where: { status: { [Op.in]: ["ACTIVE", "active"] } } });

  // Get last month's data
  const now = new Date();
  let lastMonth = now.getMonth();
  let lastYear = now.getFullYear();

  if (lastMonth === 0) {
    lastMonth = 12;
    lastYear -= 1;
  }

  const monthIn = monthWhereIn(lastMonth);
  const attendance = await Attendance.findAll({
    where: { month: monthIn ? { [Op.in]: monthIn } : lastMonth, year: lastYear },
    include: [Staff]
  });

  const lastMonthSalary = attendance.reduce((total, att) => {
    const staff = att.Staff ?? att.staff;
    const salary = Number(staff?.salary ?? 0);
    const presentDays = Number(att.present_days ?? att.presentDays ?? 0);

    const perDay = salary / 30;
    return total + perDay * presentDays;
  }, 0);

  const lastMonthAttendance = attendance.reduce((total, att) => {
    return total + Number(att.present_days ?? att.presentDays ?? 0);
  }, 0);

  res.json({
    success: true,
    data: {
      totalStaff,
      activeStaff,
      lastMonthSalary: Math.round(lastMonthSalary),
      lastMonthAttendance: lastMonthAttendance
    }
  });
};

// GET /api/dashboard/salary-monthly

export const getMonthlySalary = async (req, res) => {

  const data = await Attendance.findAll({
    attributes: ['month', 'year', 'present_days'],
    include: [Staff]
  });

  const grouped = {};

  data.forEach(att => {
    const key = `${att.month}-${att.year}`;
    const staff = att.Staff ?? att.staff;
    const salary = (Number(staff?.salary ?? 0) / 30) * Number(att.present_days ?? att.presentDays ?? 0);

    if (!grouped[key]) {
      grouped[key] = 0;
    }

    grouped[key] += salary;
  });

  const result = Object.keys(grouped).map(key => ({
    month: key,
    totalSalary: Math.round(grouped[key])
  }));

  res.json({ success: true, data: result });
};


// GET /api/dashboard/attendance-summary

export const getAttendanceSummary = async (req, res) => {

  const data = await Attendance.findAll();

  let present = 0;
  let leave = 0;

  data.forEach(att => {
    present += Number(att.present_days ?? att.presentDays ?? 0);
    leave += Number(att.leaves ?? att.leaveDays ?? 0);
  });

  res.json({
    success: true,
    data: { present, leave }
  });
};
