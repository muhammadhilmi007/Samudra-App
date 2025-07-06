const mongoose = require("mongoose");
const RolePermission = mongoose.model("RolePermission", require("../schemas/rolePermissionSchema"));
const Permission = mongoose.model("Permission", require("../schemas/permissionSchema"));
const User = mongoose.model("User", require("../schemas/userSchema"));
const Role = mongoose.model("Role", require("../schemas/roleSchema"));

// Check if user has specific permission
const checkPermission = (moduleCode, action) => {
  return async (req, res, next) => {
    try {
      // Get user from session
      const userEmail = req.session.user?.email;
      if (!userEmail) {
        return res.redirect(res.locals.base);
      }

      // Get user with role
      const user = await User.findOne({ email: userEmail }).populate('role_id');
      if (!user || !user.role_id) {
        req.session.errorMessage = "User role not found!";
        return res.redirect(res.locals.base);
      }

      // Find the permission
      const permission = await Permission.findOne({
        module_code: moduleCode,
        action: action,
        isActive: true
      });

      if (!permission) {
        req.session.errorMessage = "Permission not found!";
        return res.status(403).render('../views/errors/403', {
          title: "Access Denied",
          layout: '../views/layout/app.ejs'
        });
      }

      // Check if role has this permission
      const rolePermission = await RolePermission.findOne({
        role_id: user.role_id._id,
        permission_id: permission._id,
        allowed: true
      });

      if (!rolePermission) {
        req.session.errorMessage = "Access denied!";
        return res.status(403).render('../views/errors/403', {
          title: "Access Denied",
          layout: '../views/layout/app.ejs'
        });
      }

      // Store user permissions in request for further use
      req.userPermissions = await getUserPermissions(user.role_id._id);
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      req.session.errorMessage = "Permission check failed!";
      return res.status(500).render('../views/errors/500', {
        title: "Server Error",
        layout: '../views/layout/app.ejs'
      });
    }
  };
};

// Get all permissions for a user's role
const getUserPermissions = async (roleId) => {
  try {
    const rolePermissions = await RolePermission.find({
      role_id: roleId,
      allowed: true
    }).populate('permission_id');

    const permissions = {};
    rolePermissions.forEach(rp => {
      if (rp.permission_id) {
        const moduleCode = rp.permission_id.module_code;
        if (!permissions[moduleCode]) {
          permissions[moduleCode] = [];
        }
        permissions[moduleCode].push(rp.permission_id.action);
      }
    });

    return permissions;
  } catch (error) {
    console.error("Get user permissions error:", error);
    return {};
  }
};

// Middleware to load user permissions for all requests
const loadUserPermissions = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findOne({ email: req.session.user.email });
      if (user && user.role_id) {
        req.userPermissions = await getUserPermissions(user.role_id);
        res.locals.userPermissions = req.userPermissions;
      }
    }
    next();
  } catch (error) {
    console.error("Load permissions error:", error);
    next();
  }
};

// Helper function to check permission in views
const hasPermission = (permissions, moduleCode, action) => {
  return permissions && permissions[moduleCode] && permissions[moduleCode].includes(action);
};

module.exports = {
  checkPermission,
  getUserPermissions,
  loadUserPermissions,
  hasPermission
};