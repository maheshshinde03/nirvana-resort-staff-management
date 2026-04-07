import app from "./src/app.js";
import db from "./src/models/index.js";
import { seedAdmin } from "./src/utils/seedAdmin.js";

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await db.sequelize.sync({ alter: true });
    // ✅ alter: true → Creates or updates tables (preserves data)

    await seedAdmin(); // 🔥 add this

    console.log("✅ Tables Synced");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
})();
