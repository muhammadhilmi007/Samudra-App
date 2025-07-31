const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissionMiddleware = require("../middlewares/permission");
const localeMiddleware = require("../middlewares/locale");

// Controllers
const UserController = require("../controllers/userController");

// Apply authentication middleware to all admin routes
router.use(authMiddleware.isAuthenticated);
router.use(permissionMiddleware.loadUserPermissions);

// User Management
router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("users", "read"),
  UserController.index
);
router.get(
  "/detail/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("users", "read"),
  UserController.detail
);
router.get(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("users", "create"),
  UserController.create
);
router.post(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("users", "create"),
  UserController.upload,
  UserController.store
);
router.get(
  "/edit/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("users", "update"),
  UserController.edit
);
router.post(
  "/update/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("users", "update"),
  UserController.upload,
  UserController.update
);
router.post(
  "/delete/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("users", "delete"),
  UserController.destroy
);
router.get(
  "/export/excel/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("users", "read"),
  UserController.exportExcel
);
router.get(
  "/export/csv/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("users", "read"),
  UserController.exportCSV
);

// AJAX Endpoints
router.get(
  "/api/roles",
  authMiddleware.isAuthenticated,
  UserController.getRolesByFilters
);

module.exports = router;
