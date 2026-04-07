import db from "./src/models/index.js";

const { Staff, Salary } = db;

async function createTestSalary() {
  try {
    // Get first staff
    const staff = await Staff.findOne();
    
    if (!staff) {
      console.log("❌ No staff found. Please create staff first.");
      process.exit(1);
    }

    console.log(`✅ Found staff: ${staff.name} (ID: ${staff.id})`);

    // Create salary record for February 2026
    const salary = await Salary.create({
      staff_id: staff.id,
      month: "February",
      year: 2026,
      total_days: 30,
      present_days: 28,
      leave_days: 2,
      fixed_salary: staff.salary,
      salary_per_day: staff.salary / 30,
      deduction: (staff.salary / 30) * 2,
      total_salary: (staff.salary / 30) * 28,
      status: "PENDING"
    });

    console.log(`✅ Test salary record created:`, JSON.stringify(salary.toJSON(), null, 2));
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error("  -", e.message));
    }
    process.exit(1);
  }
}

createTestSalary();
