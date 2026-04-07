import { DataTypes } from "sequelize";

export default (sequelize) => {
  const Staff = sequelize.define("Staff", {
    staff_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      comment: "Enterprise employee ID (Emp-1, Emp-2, etc)"
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mobile: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    address: DataTypes.TEXT,
    role: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM("FULL_TIME", "PART_TIME", "CONTRACT"),
      allowNull: false
    },
    salary: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    joining_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    leaving_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      defaultValue: "ACTIVE"
    }
  }, {
    tableName: "staff",
    timestamps: true,
    hooks: {
      beforeValidate: async (staff) => {
        if (!staff.staff_id) {
          // Get the count of existing staff to generate next ID
          const count = await Staff.count();
          staff.staff_id = `Emp-${count + 1}`;
        }
      }
    }
  });

  return Staff;
};
