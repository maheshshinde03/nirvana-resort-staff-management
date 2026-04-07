import { DataTypes } from "sequelize";

export default (sequelize) => {
  return sequelize.define("Admin", {
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: "admins",
    timestamps: true
  });
};