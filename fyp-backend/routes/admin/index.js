// Main admin router - combines all admin route modules
const express = require("express");
const router = express.Router();

// Import route modules
const dashboardRoutes = require("./dashboard");
const usersRoutes = require("./users");
const foodsRoutes = require("./foods");
const activityRoutes = require("./activity");
const apkRoutes = require("./apk");
const recognitionsRoutes = require("./recognitions");

// Test route
router.get("/__test", (req, res) => {
  res.send("Admin Router OK");
});

// Mount route modules
router.use("/", dashboardRoutes);
router.use("/users", usersRoutes);
router.use("/foods", foodsRoutes);
router.use("/activity", activityRoutes);
router.use("/apks", apkRoutes);
router.use("/recognitions", recognitionsRoutes);

module.exports = router;

