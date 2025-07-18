const express = require("express");
const router = express.Router();
const KaryawanController = require("../controllers/karyawanController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("karyawan", "read"),
  KaryawanController.index
);

module.exports = router;
