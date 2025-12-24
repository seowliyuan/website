// Vercel serverless function wrapper for Express app
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.path}`);
  next();
});

// routes
const adminRoutes = require("../routes/admin.js");
app.use("/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("fyp-backend is running — try GET /admin/users");
});

// Export the Express app as a serverless function
module.exports = app;

