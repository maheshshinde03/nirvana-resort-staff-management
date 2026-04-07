import bcrypt from "bcrypt";
import db from "../models/index.js";

export const seedAdmin = async () => {
  const { Admin } = db;

  const existing = await Admin.findOne({
    where: { username: "admin" }
  });

  if (!existing) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await Admin.create({
      username: "admin",
      password: hashedPassword
    });

    console.log("✅ Admin Created (admin / admin123)");
  } else {
    console.log("ℹ️ Admin already exists");
  }
};