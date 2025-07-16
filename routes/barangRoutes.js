const express = require("express");
const router = express.Router();
const BarangController = require("../controllers/barangController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("barang", "read"),
  BarangController.index
);

module.exports = router;
