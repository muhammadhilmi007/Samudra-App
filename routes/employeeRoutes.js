const express = require("express");
const router = express.Router();
const EmployeeController = require("../controllers/employeeController");
const authMiddleware = require("../middlewares/auth");
const localeMiddleware = require("../middlewares/locale");
const permissionMiddleware = require("../middlewares/permission");

// Controllers
const UserController = require("../controllers/userController");

// Apply authentication middleware
router.use(authMiddleware.isAuthenticated);
router.use(permissionMiddleware.loadUserPermissions);

// Dashboard
router.get(
  "/dashboard/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "read"),
  EmployeeController.dashboard
);

// Employee management routes
router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "read"),
  EmployeeController.index
);

router.get(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "create"),
  EmployeeController.create
);

router.post(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "create"),
  EmployeeController.upload,
  EmployeeController.store
);

router.get(
  "/detail/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "read"),
  EmployeeController.detail
);

router.get(
  "/edit/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "update"),
  EmployeeController.edit
);

router.post(
  "/update/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "update"),
  EmployeeController.upload,
  EmployeeController.update
);

// Delete
router.post(
  "/delete/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "delete"),
  EmployeeController.destroy
);

// Mutation and resignation
router.post(
  "/mutate/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "update"),
  EmployeeController.mutate
);

router.post(
  "/resign/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "update"),
  EmployeeController.resign
);

// Document management
router.post(
  "/document/:id/upload/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "update"),
  EmployeeController.upload,
  EmployeeController.uploadDocument
);

router.post(
  "/document/:id/:documentId/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "update"),
  EmployeeController.deleteDocument
);

// Training management
router.post(
  "/training/:id/add/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "update"),
  EmployeeController.upload,
  EmployeeController.addTraining
);

router.put(
  "/training/:id/:trainingId/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "update"),
  EmployeeController.upload,
  EmployeeController.updateTraining
);

router.post(
  "/training/:id/:trainingId/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("employees", "update"),
  EmployeeController.deleteTraining
);

// AJAX Endpoints
router.get(
  "/api/roles",
  authMiddleware.isAuthenticated,
  UserController.getRolesByFilters
);

module.exports = router;