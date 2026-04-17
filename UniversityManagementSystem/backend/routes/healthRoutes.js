const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
  const databaseStates = ["disconnected", "connected", "connecting", "disconnecting"];

  res.json({
    status: "ok",
    database: databaseStates[mongoose.connection.readyState] || "unknown",
    databaseName: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
    collections: Object.values(mongoose.models).map((model) => model.collection.name).sort(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
