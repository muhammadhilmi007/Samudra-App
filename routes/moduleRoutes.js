const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissionMiddleware = require("../middlewares/permission");
const localeMiddleware = require("../middlewares/locale");

// Controllers
const ModuleController = require("../controllers/moduleController");
const UserController = require("../controllers/userController");

// Apply authentication middleware to all admin routes
router.use(authMiddleware.isAuthenticated);
router.use(permissionMiddleware.loadUserPermissions);

// Module Management
router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("modules", "read"),
  ModuleController.index
);
router.get(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("modules", "create"),
  ModuleController.create
);
router.post(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("modules", "create"),
  ModuleController.store
);
router.get(
  "/edit/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("modules", "update"),
  ModuleController.edit
);
router.post(
  "/update/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("modules", "update"),
  ModuleController.update
);
router.get(
  "/permissions/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("modules", "read"),
  ModuleController.permissions
);
router.get(
  "/update/permissions/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("modules", "read"),
  ModuleController.permissions
);
router.post(
  "/update/permissions/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("modules", "update"),
  ModuleController.addPermission
);
router.post(
  "/delete/permissions/:id/:permission_id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("modules", "delete"),
  ModuleController.deletePermission
);
router.post(
  "/delete/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("modules", "delete"),
  ModuleController.destroy
);

// AJAX Endpoints
router.get(
  "/api/roles",
  authMiddleware.isAuthenticated,
  UserController.getRolesByFilters
);

module.exports = router;
