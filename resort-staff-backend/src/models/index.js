import { sequelize } from "../config/db.js";
import AdminModel from "./admin.model.js";
import StaffModel from "./staff.model.js";
import AttendanceModel from "./attendance.model.js";
import SalaryModel from "./salary.model.js";

const db = {};

db.sequelize = sequelize;

db.Admin = AdminModel(sequelize);
db.Staff = StaffModel(sequelize);
db.Attendance = AttendanceModel(sequelize);
db.Salary = SalaryModel(sequelize);

// 🔗 Relationships
db.Staff.hasMany(db.Attendance, {
  foreignKey: "staff_id",
  onDelete: "CASCADE"
});

db.Attendance.belongsTo(db.Staff, {
  foreignKey: "staff_id"
});

db.Staff.hasMany(db.Salary, {
  foreignKey: "staff_id",
  onDelete: "CASCADE"
});

db.Salary.belongsTo(db.Staff, {
  foreignKey: "staff_id"
});

export default db;