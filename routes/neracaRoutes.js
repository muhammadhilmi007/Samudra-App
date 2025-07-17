const express = require("express");
const router = express.Router();
const NeracaController = require("../controllers/neracaController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("neraca", "read"),
  NeracaController.index
);

module.exports = router;
