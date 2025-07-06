const mongoose = require("mongoose");
const Module = mongoose.model("Module", require("../schemas/moduleSchema"));
const RolePermission = mongoose.model("RolePermission", require("../schemas/rolePermissionSchema"));
const Permission = mongoose.model("Permission", require("../schemas/permissionSchema"));

/**
 * Generate menu items based on user's role and permissions
 * @param {String} roleId - User's role ID
 * @returns {Array} Array of menu items with their sub-items
 */
const generateMenu = async (roleId) => {
  try {
    if (!roleId) return [];

    // Get all permissions for the role
    const rolePermissions = await RolePermission.find({
      role_id: roleId,
      allowed: true
    }).populate({
      path: 'permission_id',
      match: { action: 'read' } // Only need read permission to show in menu
    });

    // Extract module codes that user has access to
    const allowedModuleCodes = new Set();
    rolePermissions.forEach(rp => {
      if (rp.permission_id) {
        allowedModuleCodes.add(rp.permission_id.module_code);
      }
    });

    // Get all active modules
    const modules = await Module.find({ isActive: true }).sort({ order: 1 });

    // Build menu structure
    const menu = [];
    const moduleMap = new Map();

    // First pass: Create module map
    modules.forEach(module => {
      moduleMap.set(module._id.toString(), {
        _id: module._id,
        name: module.name,
        code: module.code,
        icon: module.icon,
        route: module.route,
        parent_id: module.parent_id,
        children: []
      });
    });

    // Second pass: Build hierarchy
    modules.forEach(module => {
      if (allowedModuleCodes.has(module.code)) {
        const moduleItem = moduleMap.get(module._id.toString());
        
        if (module.parent_id) {
          // Add as child to parent
          const parent = moduleMap.get(module.parent_id.toString());
          if (parent && allowedModuleCodes.has(parent.code)) {
            parent.children.push(moduleItem);
          }
        } else {
          // Top-level menu item
          menu.push(moduleItem);
        }
      }
    });

    return menu;
  } catch (error) {
    console.error("Error generating menu:", error);
    return [];
  }
};

/**
 * Check if user has permission for a specific module
 * @param {String} roleId - User's role ID
 * @param {String} moduleCode - Module code to check
 * @param {String} action - Action to check (create, read, update, delete)
 * @returns {Boolean} True if user has permission
 */
const hasModulePermission = async (roleId, moduleCode, action = 'read') => {
  try {
    if (!roleId || !moduleCode) return false;

    const permission = await Permission.findOne({
      module_code: moduleCode,
      action: action,
      isActive: true
    });

    if (!permission) return false;

    const rolePermission = await RolePermission.findOne({
      role_id: roleId,
      permission_id: permission._id,
      allowed: true
    });

    return !!rolePermission;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
};

/**
 * Get all permissions for a role grouped by module
 * @param {String} roleId - User's role ID
 * @returns {Object} Permissions grouped by module code
 */
const getRolePermissions = async (roleId) => {
  try {
    if (!roleId) return {};

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
    console.error("Error getting role permissions:", error);
    return {};
  }
};

module.exports = {
  generateMenu,
  hasModulePermission,
  getRolePermissions
};