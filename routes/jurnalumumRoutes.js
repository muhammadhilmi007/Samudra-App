const express = require("express");
const router = express.Router();
const JurnalUmumController = require("../controllers/jurnalumumController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("jurnalumum", "read"),
  JurnalUmumController.index
);

module.exports = router;
