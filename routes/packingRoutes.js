const express = require("express");
const router = express.Router();
const PackingController = require("../controllers/packingController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("packing", "read"),
  PackingController.index
);

module.exports = router;
