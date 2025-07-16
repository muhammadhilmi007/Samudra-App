const express = require("express");
const router = express.Router();
const EkspedisiController = require("../controllers/ekspedisiController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("ekspedisi", "read"),
  EkspedisiController.index
);

module.exports = router;
