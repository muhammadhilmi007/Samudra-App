const express = require("express");
const router = express.Router();
const TruckMitraController = require("../controllers/truckMitraController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

router.use(authMiddleware.isAuthenticated);

router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("truck-mitra", "read"),
  TruckMitraController.index
);

router.get(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("truck-mitra", "create"),
  TruckMitraController.create
);

router.post(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("truck-mitra", "create"),
  TruckMitraController.store
);

router.get(
  "/delivery-history/:id/:language(en|gr|ar)",
  [localeMiddleware.localized],
  permissionMiddleware.checkPermission("truck-mitra", "read"),
  TruckMitraController.deliveryHistory
);

// API endpoints
router.post(
  "/api/location/:id",
  authMiddleware.isAuthenticated,
  TruckMitraController.updateLocation
);

router.post(
  "/api/activity/:id",
  authMiddleware.isAuthenticated,
  TruckMitraController.logActivity
);

module.exports = router;
