const express = require("express");
const Application = require("../models/Application");

const router = express.Router();

function requireAdmin(req, res) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Only admins can access applications" });
    return false;
  }
  return true;
}

router.get("/", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const status = req.query.status;
    const filter = status ? { status } : {};
    const sort = status === "pending" ? { submittedAt: 1 } : { submittedAt: -1 };

    const applications = await Application.find(filter).sort(sort);
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: "Application not found" });

    res.json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { name, nationalId, highSchool, highSchoolGrade } = req.body;

    if (!name || !nationalId || !highSchool || !highSchoolGrade) {
      return res.status(400).json({ error: "name, nationalId, highSchool, highSchoolGrade required" });
    }

    const application = await Application.create({
      name: name.trim(),
      nationalId: nationalId.trim(),
      highSchool: highSchool.trim(),
      highSchoolGrade: highSchoolGrade.trim(),
    });

    res.status(201).json(application);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
