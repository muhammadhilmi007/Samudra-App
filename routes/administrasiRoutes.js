const express = require("express");
const router = express.Router();
const AdministrasiController = require("../controllers/administrasiController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");

router.get(
  "/cabang/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  AdministrasiController.cabang
);
router.get(
  "/divisi/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  AdministrasiController.divisi
);
router.get(
  "/kendaraan/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  AdministrasiController.kendaraan
);
router.get(
  "/surat/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  AdministrasiController.surat
);
router.get(
  "/tagihan/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  AdministrasiController.tagihan
);
router.get(
  "/retur/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  AdministrasiController.retur
);
router.get(
  "/overdue/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  AdministrasiController.overdue
);
router.get(
  "/invoice/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  AdministrasiController.invoice
);

module.exports = router;
