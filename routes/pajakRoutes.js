const express = require("express");
const router = express.Router();
const PajakController = require("../controllers/pajakController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("pajak", "read"),
  PajakController.index
);

module.exports = router;
