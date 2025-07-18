const express = require("express");
const router = express.Router();
const PenjualanController = require("../controllers/penjualanController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("penjualan", "read"),
  PenjualanController.index
);

module.exports = router;
