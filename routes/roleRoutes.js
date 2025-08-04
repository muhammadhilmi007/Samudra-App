const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");
const permissionMiddleware = require("../middlewares/permission");
const localeMiddleware = require("../middlewares/locale");

// Controllers
const RoleController = require("../controllers/roleController");
const UserController = require("../controllers/userController");

// Apply authentication middleware to all admin routes
router.use(authMiddleware.isAuthenticated);
router.use(permissionMiddleware.loadUserPermissions);

// Role Management - Basic CRUD
router.get(
  "/index/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("roles", "read"),
  RoleController.index
);

router.get(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("roles", "create"),
  RoleController.create
);

router.post(
  "/create/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("roles", "create"),
  RoleController.store
);

router.get(
  "/edit/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("roles", "update"),
  RoleController.edit
);

router.post(
  "/update/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("roles", "update"),
  RoleController.update
);

router.post(
  "/delete/:id/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("roles", "delete"),
  RoleController.destroy
);

// Permission Management
router.get(
  "/edit/:id/permissions/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("roles", "update"),
  RoleController.permissions
);

router.post(
  "/update/:id/permissions/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("roles", "update"),
  RoleController.updatePermissions
);

// New Features Routes
router.post(
  "/create-from-template/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("roles", "create"),
  RoleController.createFromTemplate
);

router.post(
  "/bulk-assign/:language(en|gr|ar)",
  [localeMiddleware.localized, authMiddleware.isAuthenticated],
  permissionMiddleware.checkPermission("roles", "update"),
  RoleController.bulkAssign
);

// AJAX Endpoints
router.get(
  "/api/roles",
  authMiddleware.isAuthenticated,
  UserController.getRolesByFilters
);


// API Endpoints
router.get(
  "/api/hierarchy",
  authMiddleware.isAuthenticated,
  permissionMiddleware.checkPermission("roles", "read"),
  RoleController.getHierarchy
);

// AJAX Endpoints for dynamic forms
router.get(
  "/api/templates",
  authMiddleware.isAuthenticated,
  async (req, res) => {
    try {
      const mongoose = require("mongoose");
      const Role = mongoose.model("Role");
      const templates = await Role.find({ isTemplate: true, isActive: true })
        .select("name description")
        .sort({ name: 1 });
      res.json({ success: true, templates });
    } catch (error) {
      res.json({ success: false, message: "Failed to load templates" });
    }
  }
);

router.get(
  "/api/users-without-role",
  authMiddleware.isAuthenticated,
  async (req, res) => {
    try {
      const mongoose = require("mongoose");
      const User = mongoose.model("User");
      const currentUser = await User.findById(req.session.user._id);
      
      let query = { 
        $or: [
          { role_id: null },
          { role_id: { $exists: false } }
        ],
        isActive: true 
      };
      
      // Filter by branch for non-pusat users
      if (currentUser.level === "Cabang") {
        query.branch_id = currentUser.branch_id;
      }
      
      const users = await User.find(query)
        .select("firstname lastname email level branch_id")
        .populate("branch_id", "name")
        .sort({ firstname: 1 });
        
      res.json({ success: true, users });
    } catch (error) {
      res.json({ success: false, message: "Failed to load users" });
    }
  }
);

module.exports = router;