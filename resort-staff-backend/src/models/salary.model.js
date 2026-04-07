import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Salary", {
    staff_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "References Staff.id (database primary key)"
    },
    month: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30
    },
    present_days: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    leave_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    fixed_salary: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Basic salary from Staff record"
    },
    salary_per_day: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Fixed salary divided by total days (usually 30)"
    },
    deduction: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      comment: "Deduction based on leave days"
    },
    total_salary: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: "Final salary after deductions"
    },
    status: {
      type: DataTypes.ENUM("PENDING", "FINALIZED", "PAID"),
      defaultValue: "PENDING"
    }
  }, {
    tableName: "salary",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["staff_id", "month", "year"] // 🚀 prevent duplicate salary records
      }
    ]
  });
};
