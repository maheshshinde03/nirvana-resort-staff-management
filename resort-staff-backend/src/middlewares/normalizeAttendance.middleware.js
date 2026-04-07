// Salary and attendance are fixed on a 30-day basis (not calendar days).
const FIXED_TOTAL_DAYS = 30;

export const normalizeAttendanceBody = (req, res, next) => {
  if (!req.body || typeof req.body !== "object") return next();

  // Always normalize to fixed 30-day month for attendance
  req.body.total_days = FIXED_TOTAL_DAYS;

  // Remove empty leave reason
  if (typeof req.body.leave_reason === "string" && req.body.leave_reason.trim() === "") {
    delete req.body.leave_reason;
  }

  next();
};
