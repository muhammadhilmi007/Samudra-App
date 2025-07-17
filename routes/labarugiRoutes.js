const express = require("express");
const router = express.Router();
const LabaRugiController = require("../controllers/labarugiController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("labarugi", "read"),
  LabaRugiController.index
);

module.exports = router;
