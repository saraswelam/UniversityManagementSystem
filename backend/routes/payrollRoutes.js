const express = require("express");
const Payroll = require("../models/Payroll");

const router = express.Router();

// Get payroll for current user
router.get("/", async (req, res) => {
  try {
    const payrolls = await Payroll.find({ staffId: req.user.id }).sort({ month: -1 });
    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current month payroll
router.get("/current", async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const payroll = await Payroll.findOne({ 
      staffId: req.user.id, 
      month: currentMonth 
    });

    if (!payroll) {
      return res.status(404).json({ error: "No payroll found for current month" });
    }

    res.json(payroll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create payroll entry
router.post("/", async (req, res) => {
  try {
    // Only admin can create payroll entries
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create payroll entries" });
    }

    const { staffId, staffName, staffEmail, employeeId, month, basicSalary, allowances, deductions } = req.body;

    if (!staffId || !staffName || !staffEmail || !employeeId || !month || basicSalary === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const netPay = basicSalary + (allowances || 0) - (deductions || 0);

    const payroll = await Payroll.create({
      staffId,
      staffName,
      staffEmail,
      employeeId,
      month,
      basicSalary,
      allowances: allowances || 0,
      deductions: deductions || 0,
      netPay,
      createdBy: req.user.id,
    });

    res.status(201).json(payroll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
