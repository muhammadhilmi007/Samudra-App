const express = require("express");
const router = express.Router();
const AkunController = require("../controllers/akunController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("akun", "read"),
  AkunController.index
);

module.exports = router;
