const express = require("express");
const router = express.Router();
const KasBantuanController = require("../controllers/kasbantuanController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("kasbantuan", "read"),
  KasBantuanController.index
);

module.exports = router;
