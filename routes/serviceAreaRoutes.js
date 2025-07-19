const express = require("express");
const router = express.Router();
const ServiceAreaController = require("../controllers/serviceAreaController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.use(authMiddleware.isAuthenticated);

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("service-areas", "read"),
  ServiceAreaController.index
);

router.get(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("service-areas", "create"),
  ServiceAreaController.create
);

router.post(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("service-areas", "create"),
  ServiceAreaController.store
);

router.post(
  "/bulk-import/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("service-areas", "create"),
  ServiceAreaController.bulkImport
);

module.exports = router;
