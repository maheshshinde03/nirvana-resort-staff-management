export const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err);

  // ✅ Sequelize Validation Error
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: err.errors.map(e => e.message)
    });
  }

  // ✅ Handle custom errors (from next({ status, message }))
  let message = err.message || "Internal Server Error";

  // 🔥 Ensure message is always string
  if (typeof message !== "string") {
    message = JSON.stringify(message);
  }

  return res.status(err.status || 500).json({
    success: false,
    message
  });
};