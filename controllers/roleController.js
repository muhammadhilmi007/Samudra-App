const mongoose = require("mongoose");
const Role = mongoose.model("Role", require("../schemas/roleSchema"));
const Branch = mongoose.model("Branch", require("../schemas/branchSchema"));
const Division = mongoose.model(
  "Division",
  require("../schemas/divisionSchema")
);
const Position = mongoose.model(
  "Position",
  require("../schemas/positionSchema")
);
const Permission = mongoose.model(
  "Permission",
  require("../schemas/permissionSchema")
);
const RolePermission = mongoose.model(
  "RolePermission",
  require("../schemas/rolePermissionSchema")
);
const Module = mongoose.model("Module", require("../schemas/moduleSchema"));
const User = mongoose.model("User", require("../schemas/userSchema"));

// List all roles with filtering
const index = async (req, res) => {
  try {
    console.log("Query params:", req.query);

    const divisions = await Division.find().sort({ name: 1 });
    const positions = await Position.find().sort({ name: 1 });
    const branches = await Branch.find().sort({ name: 1 });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const levelFilter = req.query.level || "";
    const branchFilter = req.query.branch || "";

    // Build query
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Level filter
    if (levelFilter) {
      query.level = levelFilter;
    }

    // Branch filter (only for cabang level)
    if (branchFilter && levelFilter === "cabang") {
      query.branch_id = branchFilter;
    }

    console.log("Role query:", query);

    // Get roles with pagination
    const [roles, total] = await Promise.all([
      Role.find(query)
        .populate("branch_id")
        .populate("division_id")
        .populate("position_id")
        .populate("parent_role_id")
        .sort({ level: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Role.countDocuments(query),
    ]);

    // Get role hierarchy for visualization
    const roleHierarchy = await Role.getRoleHierarchy();

    console.log("Roles found:", roles.length, "Total roles:", total);

    const totalPages = Math.ceil(total / limit);

    res.render("../views/pages/settings/roles/index.ejs", {
      title: "Roles",
      roles,
      roleHierarchy,
      layout: "../views/layout/app.ejs",
      name: "roles",
      currentPage: page,
      totalPages,
      limit,
      total,
      search,
      levelFilter,
      branchFilter,
      branches,
      divisions,
      positions,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load roles!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

// Show create form
const create = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ name: 1 });
    const parentRoles = await Role.find({ status: "active" })
      .populate("branch_id")
      .sort({ level: 1, name: 1 });

    res.render("../views/pages/settings/roles/create", {
      title: "Create Role",
      branches: branches,
      divisions: divisions,
      positions: positions,
      parentRoles: parentRoles,
      layout: "../views/layout/app.ejs",
      name: "roles",
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load form data!";
    res.redirect(
      process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
    );
  }
};

// Store new role with validation
const store = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    // Validate level and branch_id
    if (req.body.level === "cabang" && !req.body.branch_id) {
      throw new Error("Branch is required for cabang level roles!");
    }

    if (req.body.level === "pusat" && req.body.branch_id) {
      req.body.branch_id = null; // Clear branch_id for pusat roles
    }

    const role = new Role({
      name: req.body.name,
      description: req.body.description,
      level: req.body.level || "cabang",
      branch_id: req.body.branch_id || null,
      division_id: req.body.division_id,
      position_id: req.body.position_id,
      parent_role_id: req.body.parent_role_id || null,
      status: req.body.status || "active",
      isActive: req.body.isActive === "on",
    });

    await role.save();
    console.log("Role created:", role);

    // Copy permissions from parent role if specified
    if (req.body.parent_role_id && req.body.copy_permissions === "on") {
      const parentPermissions = await RolePermission.find({
        role_id: req.body.parent_role_id,
        allowed: true,
      });

      const newPermissions = parentPermissions.map((p) => ({
        role_id: role._id,
        permission_id: p.permission_id,
        allowed: true,
      }));

      if (newPermissions.length > 0) {
        await RolePermission.insertMany(newPermissions);
      }
    }

    req.session.successMessage = "Role created successfully!";
    res.redirect(
      process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
    );
  } catch (error) {
    console.error("Error creating role:", error);
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ name: 1 });
    const parentRoles = await Role.find({ status: "active" }).sort({
      level: 1,
      name: 1,
    });

    res.render("../views/pages/settings/roles/create", {
      title: "Create Role",
      branches: branches,
      divisions: divisions,
      positions: positions,
      parentRoles: parentRoles,
      layout: "../views/layout/app.ejs",
      name: "roles",
      errors: { general: { message: error.message } },
      input: req.body,
      successMessage: req.session.successMessage || null,
      errorMessage: error.message,
    });
  }
};

// Show permissions form
const permissions = async (req, res) => {
  try {
    console.log("Permissions form for role id:", req.params.id);

    const role = await Role.findById(req.params.id)
      .populate("branch_id")
      .populate("division_id")
      .populate("position_id")
      .populate("parent_role_id");

    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
      );
    }

    // Get all modules with their permissions
    const modules = await Module.find({ isActive: true, parent_id: null }).sort(
      { order: 1 }
    );
    console.log("Modules found:", modules.length);

    const allPermissions = await Permission.find({ isActive: true });
    console.log("All permissions found:", allPermissions.length);

    // Get current role permissions
    const rolePermissions = await RolePermission.find({ role_id: role._id });
    console.log("Role permissions found:", rolePermissions.length);

    const currentPermissions = {};
    rolePermissions.forEach((rp) => {
      currentPermissions[rp.permission_id.toString()] = rp.allowed;
    });

    // Get parent role permissions if exists
    let parentPermissions = {};
    if (role.parent_role_id) {
      const parentRolePermissions = await RolePermission.find({
        role_id: role.parent_role_id._id,
      });
      parentRolePermissions.forEach((rp) => {
        parentPermissions[rp.permission_id.toString()] = rp.allowed;
      });
    }

    // Organize permissions by module
    const modulePermissions = {};
    for (const module of modules) {
      modulePermissions[module.code] = {
        module: module,
        permissions: allPermissions.filter(
          (p) => p.module_code === module.code
        ),
      };
    }
    console.log("Module permissions keys:", Object.keys(modulePermissions));

    res.render("../views/pages/settings/roles/permissions", {
      title: "Role Permissions",
      role: role,
      modulePermissions: modulePermissions,
      currentPermissions: currentPermissions,
      parentPermissions: parentPermissions,
      layout: "../views/layout/app.ejs",
      name: "roles",
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load permissions!";
    res.redirect(
      process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
    );
  }
};

// Update permissions
const updatePermissions = async (req, res) => {
  try {
    const roleId = req.params.id;
    console.log("Updating permissions for role:", roleId);

    // Delete all existing permissions for this role
    const deleteResult = await RolePermission.deleteMany({ role_id: roleId });
    console.log("Deleted role permissions:", deleteResult.deletedCount);

    // Add new permissions
    const permissions = req.body.permissions || [];
    console.log("New permissions to add:", permissions);

    for (const permissionId of permissions) {
      const created = await RolePermission.create({
        role_id: roleId,
        permission_id: permissionId,
        allowed: true,
      });
      console.log("Created RolePermission:", created._id);
    }

    req.session.successMessage = "Permissions updated successfully!";
    res.redirect(
      process.env.BASE_URL +
        "settings/roles/edit/" +
        roleId +
        "/permissions/" +
        res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to update permissions!";
    res.redirect(
      process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
    );
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    console.log("Edit form for role id:", req.params.id);
    const role = await Role.findById(req.params.id);
    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
      );
    }

    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ name: 1 });
    const parentRoles = await Role.find({
      status: "active",
      _id: { $ne: role._id }, // Exclude current role
    }).sort({ level: 1, name: 1 });

    console.log("Branches found:", branches.length);
    console.log("Divisions found:", divisions.length);
    console.log("Positions found:", positions.length);

    res.render("../views/pages/settings/roles/edit", {
      title: "Edit Role",
      role: role,
      branches: branches,
      divisions: divisions,
      positions: positions,
      parentRoles: parentRoles,
      layout: "../views/layout/app.ejs",
      name: "roles",
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null,
    });
  } catch (error) {
    console.error("Error loading edit form:", error);
    req.session.errorMessage = "Failed to load role!";
    res.redirect(
      process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
    );
  }
};

// Update role
const update = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
      );
    }

    // Validate level and branch_id
    if (req.body.level === "cabang" && !req.body.branch_id) {
      throw new Error("Branch is required for cabang level roles!");
    }

    if (req.body.level === "pusat") {
      req.body.branch_id = null; // Clear branch_id for pusat roles
    }

    role.name = req.body.name;
    role.description = req.body.description;
    role.level = req.body.level || role.level;
    role.branch_id = req.body.branch_id || null;
    role.division_id = req.body.division_id;
    role.position_id = req.body.position_id;
    role.parent_role_id = req.body.parent_role_id || null;
    role.status = req.body.status || role.status;
    role.isActive = req.body.isActive === "on";

    await role.save();
    req.session.successMessage = "Role updated successfully!";
    res.redirect(
      process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ name: 1 });
    const parentRoles = await Role.find({ status: "active" }).sort({
      level: 1,
      name: 1,
    });

    res.render("../views/pages/settings/roles/edit", {
      title: "Edit Role",
      role: role,
      branches: branches,
      divisions: divisions,
      positions: positions,
      parentRoles: parentRoles,
      layout: "../views/layout/app.ejs",
      name: "roles",
      errors: { general: { message: error.message } },
      input: req.body,
      successMessage: req.session.successMessage || null,
      errorMessage: error.message,
    });
  }
};

// Delete role (soft delete)
const destroy = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
      );
    }

    // Check if role has children
    const hasChildren = await role.hasChildren();
    if (hasChildren) {
      req.session.errorMessage = "Cannot delete role with child roles!";
      return res.redirect(
        process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
      );
    }

    // Check if role is used by users
    const isUsed = await role.isUsedByUsers();
    if (isUsed) {
      req.session.errorMessage =
        "Cannot delete role that is assigned to users!";
      return res.redirect(
        process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
      );
    }

    // Soft delete - change status to inactive
    role.status = "inactive";
    role.isActive = false;
    await role.save();

    // Optional: Also delete role permissions
    // await RolePermission.deleteMany({ role_id: req.params.id });

    req.session.successMessage = "Role deactivated successfully!";
    res.redirect(
      process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete role!";
    res.redirect(
      process.env.BASE_URL + "settings/roles/index/" + res.getLocale()
    );
  }
};

// Get role templates
const getTemplates = async (req, res) => {
  try {
    const templates = [
      {
        name: "Admin Pusat Template",
        level: "pusat",
        description: "Full system access for central administrators",
        suggested_permissions: ["all"],
      },
      {
        name: "Admin Cabang Template",
        level: "cabang",
        description: "Branch administrator with limited access",
        suggested_permissions: ["dashboard", "sales", "inventory", "reports"],
      },
      {
        name: "Staff Operasional Template",
        level: "cabang",
        description: "Operational staff with basic access",
        suggested_permissions: ["dashboard", "sales", "inventory"],
      },
      {
        name: "Manager Keuangan Template",
        level: "pusat",
        description: "Finance manager with financial module access",
        suggested_permissions: ["dashboard", "finance", "reports"],
      },
    ];

    res.json({ success: true, templates });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Failed to load templates" });
  }
};

// Bulk assign users to role
const bulkAssignUsers = async (req, res) => {
  try {
    const { role_id, user_ids } = req.body;

    if (!role_id || !user_ids || !Array.isArray(user_ids)) {
      return res.json({
        success: false,
        message: "Invalid request data",
      });
    }

    const role = await Role.findById(role_id);
    if (!role) {
      return res.json({
        success: false,
        message: "Role not found",
      });
    }

    // Update users
    const result = await User.updateMany(
      { _id: { $in: user_ids } },
      { $set: { role_id: role_id } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} users assigned to role successfully`,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Failed to assign users to role",
    });
  }
};

module.exports = {
  index,
  create,
  store,
  permissions,
  updatePermissions,
  edit,
  update,
  destroy,
  getTemplates,
  bulkAssignUsers,
};
