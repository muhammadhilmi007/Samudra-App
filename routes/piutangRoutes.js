const express = require("express");
const router = express.Router();
const PiutangController = require("../controllers/piutangController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("piutang", "read"),
  PiutangController.index
);

module.exports = router;
