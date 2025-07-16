const express = require("express");
const router = express.Router();
const AruskasController = require("../controllers/aruskasController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("aruskas", "read"),
  AruskasController.index
);

module.exports = router;
