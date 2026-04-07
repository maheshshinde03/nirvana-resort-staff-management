import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Attendance", {
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
      allowNull: false
    },
    present_days: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    absent_days: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    leaves: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    leave_reason: DataTypes.STRING
  }, {
    tableName: "attendance",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["staff_id", "month", "year"] // 🚀 prevent duplicate
      }
    ]
  });
};
