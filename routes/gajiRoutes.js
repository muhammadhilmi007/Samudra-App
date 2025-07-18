const express = require("express");
const router = express.Router();
const GajiController = require("../controllers/gajiController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("gaji", "read"),
  GajiController.index
);

module.exports = router;
