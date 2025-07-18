const express = require("express");
const router = express.Router();
const LaporanController = require("../controllers/laporanController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("laporan", "read"),
  LaporanController.index
);

module.exports = router;
