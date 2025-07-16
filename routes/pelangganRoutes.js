const express = require("express");
const router = express.Router();
const PelangganController = require("../controllers/pelangganController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("pelanggan", "read"),
  PelangganController.index
);

module.exports = router;
