const express = require("express");
const router = express.Router();
const MitraEkspedisiController = require("../controllers/mitraEkspedisiController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.use(authMiddleware.isAuthenticated);

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("mitra-ekspedisi", "read"),
  MitraEkspedisiController.index
);

router.get(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("mitra-ekspedisi", "create"),
  MitraEkspedisiController.create
);

router.post(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("mitra-ekspedisi", "create"),
  MitraEkspedisiController.store
);

router.get(
  "/areas/:id/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("mitra-ekspedisi", "read"),
  MitraEkspedisiController.manageAreas
);

router.post(
  "/areas/:id/add/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("mitra-ekspedisi", "update"),
  MitraEkspedisiController.addArea
);

module.exports = router;
