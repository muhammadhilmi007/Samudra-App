const express = require("express");
const router = express.Router();
const CutiController = require("../controllers/cutiController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("cuti", "read"),
  CutiController.index
);

module.exports = router;
