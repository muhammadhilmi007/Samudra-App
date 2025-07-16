const express = require("express");
const router = express.Router();
const HargaController = require("../controllers/hargaController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("harga", "read"),
  HargaController.index
);

module.exports = router;
