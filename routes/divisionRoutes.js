const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissionMiddleware = require("../middlewares/permission");
const localeMiddleware = require("../middlewares/locale");

// Controllers
const DivisionController = require("../controllers/divisionController");
const UserController = require('../controllers/userController');

// Apply authentication middleware to all admin routes
router.use(authMiddleware.isAuthenticated);
router.use(permissionMiddleware.loadUserPermissions);

// Division Management
router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("divisions", "read"),
  DivisionController.index
);
router.get(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("divisions", "create"),
  DivisionController.create
);
router.post(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("divisions", "create"),
  DivisionController.store
);
router.get(
  "/edit/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("divisions", "update"),
  DivisionController.edit
);
router.post(
  "/update/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("divisions", "update"),
  DivisionController.update
);
router.post(
  "/delete/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("divisions", "delete"),
  DivisionController.destroy
);

// AJAX Endpoints
router.get('/api/roles', authMiddleware.isAuthenticated, UserController.getRolesByFilters);

module.exports = router;
