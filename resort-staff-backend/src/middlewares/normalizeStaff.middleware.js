export const normalizeStaffBody = (req, res, next) => {
  if (!req.body || typeof req.body !== "object") return next();

  // Remove empty leaving_date
  if (typeof req.body.leaving_date === "string" && req.body.leaving_date.trim() === "") {
    delete req.body.leaving_date;
  }

  // Normalize category to uppercase
  if (typeof req.body.category === "string") {
    req.body.category = req.body.category.toUpperCase();
  }

  // Normalize status to uppercase
  if (typeof req.body.status === "string") {
    const status = req.body.status.toUpperCase();
    if (status === "ACTIVE" || status === "INACTIVE") {
      req.body.status = status;
    }
  }

  // If staff is ACTIVE, clear leaving_date
  if (req.body.status === "ACTIVE") {
    req.body.leaving_date = null;
  }

  next();
};
