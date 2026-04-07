import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import db from "../models/index.js";

dotenv.config();

const { Admin } = db;

export const login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const identifier = username ?? email;

    // 1. Validate input
    if (!identifier || !password) {
      return res.status(400).json({ message: "Username & password required" });
    }

    // 2. Check admin exists
    const admin = await Admin.findOne({ where: { username: identifier } });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 5. Send response
    res.json({
      message: "Login successful",
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
