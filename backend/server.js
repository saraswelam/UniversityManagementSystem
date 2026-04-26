require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const healthRoutes = require("./routes/healthRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "UMS API is running" });
});

app.use("/api/health", healthRoutes);

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
