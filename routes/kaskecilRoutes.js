const express = require("express");
const router = express.Router();
const KasKecilController = require("../controllers/kaskecilController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("kaskecil", "read"),
  KasKecilController.index
);

module.exports = router;
