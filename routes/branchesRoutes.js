const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissionMiddleware = require("../middlewares/permission");
const localeMiddleware = require("../middlewares/locale");

// Controllers
const BranchController = require("../controllers/branchController");
const UserController = require("../controllers/userController");

// Apply authentication middleware to all admin routes
router.use(authMiddleware.isAuthenticated);
router.use(permissionMiddleware.loadUserPermissions);

// Branch Management
router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("branches", "read"),
  BranchController.index
);

router.get(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("branches", "create"),
  BranchController.create
);

router.post(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("branches", "create"),
  BranchController.store
);

router.get(
  "/edit/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("branches", "update"),
  BranchController.edit
);

router.post(
  "/update/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("branches", "update"),
  BranchController.update
);

router.post(
  "/delete/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("branches", "delete"),
  BranchController.destroy
);

// === OPTIONAL: Tambahan untuk fitur berdasarkan schema baru ===

// Ambil koordinat lokasi cabang (GeoJSON)
router.get(
  "/location/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("branches", "read"),
  BranchController.getLocation
);

// Ambil daftar cabang induk (untuk parent selection dropdown)
router.get(
  "/api/parents/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("branches", "read"),
  BranchController.getParentBranches
);

// Autocomplete manager (pegawai)
router.get(
  "/api/managers/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("branches", "read"),
  BranchController.getManagers
);

// AJAX Endpoint untuk dynamic filter cabang
router.get(
  "/api/branches/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("branches", "read"),
  BranchController.getBranches
);

// Roles API
router.get(
  "/api/roles/",
  authMiddleware.isAuthenticated,
  UserController.getRolesByFilters
);

module.exports = router;
