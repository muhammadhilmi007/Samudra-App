const mongoose = require("mongoose");
const Role = mongoose.model("Role", require("../schemas/roleSchema"));
const Branch = mongoose.model("Branch", require("../schemas/branchSchema"));
const Division = mongoose.model("Division", require("../schemas/divisionSchema"));
const Position = mongoose.model("Position", require("../schemas/positionSchema"));
const Permission = mongoose.model("Permission", require("../schemas/permissionSchema"));
const RolePermission = mongoose.model("RolePermission", require("../schemas/rolePermissionSchema"));
const Module = mongoose.model("Module", require("../schemas/moduleSchema"));

// List all roles
const index = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('branch_id')
      .populate('division_id')
      .populate('position_id')
      .sort({ name: 1 });

    res.render("../views/pages/admin/roles/index.ejs", {
      title: "Roles",
      roles: roles,
      layout: "../views/layout/app.ejs",
      name: "roles"
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

    res.render("../views/pages/admin/roles/create", {
      title: "Create Role",
      branches: branches,
      divisions: divisions,
      positions: positions,
      layout: "../views/layout/app.ejs",
      name: "roles"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load form data!";
    res.redirect(res.locals.base + "admin/roles");
  }
};

// Store new role
const store = async (req, res) => {
  try {
    const role = new Role({
      name: req.body.name,
      description: req.body.description,
      branch_id: req.body.branch_id,
      division_id: req.body.division_id,
      position_id: req.body.position_id,
      isActive: req.body.isActive === 'on'
    });

    await role.save();
    req.session.successMessage = "Role created successfully!";
    res.redirect(res.locals.base + "admin/roles");
  } catch (error) {
    console.error(error);
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ name: 1 });

    res.render("../views/pages/admin/roles/create", {
      title: "Create Role",
      branches: branches,
      divisions: divisions,
      positions: positions,
      layout: "../views/layout/app.ejs",
      name: "roles",
      errors: error.errors,
      input: req.body
    });
  }
};

// Show permissions form
const permissions = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('branch_id')
      .populate('division_id')
      .populate('position_id');

    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(res.locals.base + "admin/roles");
    }

    // Get all modules with their permissions
    const modules = await Module.find({ isActive: true, parent_id: null }).sort({ order: 1 });
    const allPermissions = await Permission.find({ isActive: true });
    
    // Get current role permissions
    const rolePermissions = await RolePermission.find({ role_id: role._id });
    const currentPermissions = {};
    rolePermissions.forEach(rp => {
      currentPermissions[rp.permission_id.toString()] = rp.allowed;
    });

    // Organize permissions by module
    const modulePermissions = {};
    for (const module of modules) {
      modulePermissions[module.code] = {
        module: module,
        permissions: allPermissions.filter(p => p.module_code === module.code)
      };
    }

    res.render("../views/pages/admin/roles/permissions", {
      title: "Role Permissions",
      role: role,
      modulePermissions: modulePermissions,
      currentPermissions: currentPermissions,
      layout: "../views/layout/app.ejs",
      name: "roles"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load permissions!";
    res.redirect(res.locals.base + "admin/roles");
  }
};

// Update permissions
const updatePermissions = async (req, res) => {
  try {
    const roleId = req.params.id;
    
    // Delete all existing permissions for this role
    await RolePermission.deleteMany({ role_id: roleId });

    // Add new permissions
    const permissions = req.body.permissions || [];
    for (const permissionId of permissions) {
      await RolePermission.create({
        role_id: roleId,
        permission_id: permissionId,
        allowed: true
      });
    }

    req.session.successMessage = "Permissions updated successfully!";
    res.redirect(res.locals.base + "admin/roles");
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to update permissions!";
    res.redirect(res.locals.base + "admin/roles/permissions/" + req.params.id);
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(res.locals.base + "admin/roles");
    }

    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ name: 1 });

    res.render("../views/pages/admin/roles/edit", {
      title: "Edit Role",
      role: role,
      branches: branches,
      divisions: divisions,
      positions: positions,
      layout: "../views/layout/app.ejs",
      name: "roles"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load role!";
    res.redirect(res.locals.base + "admin/roles");
  }
};

// Update role
const update = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      req.session.errorMessage = "Role not found!";
      return res.redirect(res.locals.base + "admin/roles");
    }

    role.name = req.body.name;
    role.description = req.body.description;
    role.branch_id = req.body.branch_id;
    role.division_id = req.body.division_id;
    role.position_id = req.body.position_id;
    role.isActive = req.body.isActive === 'on';

    await role.save();
    req.session.successMessage = "Role updated successfully!";
    res.redirect(res.locals.base + "admin/roles");
  } catch (error) {
    console.error(error);
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 });
    const positions = await Position.find({ isActive: true }).sort({ name: 1 });

    res.render("../views/pages/admin/roles/edit", {
      title: "Edit Role",
      role: role,
      branches: branches,
      divisions: divisions,
      positions: positions,
      layout: "../views/layout/app.ejs",
      name: "roles",
      errors: error.errors,
      input: req.body
    });
  }
};

// Delete role
const destroy = async (req, res) => {
  try {
    // Delete related role permissions first
    await RolePermission.deleteMany({ role_id: req.params.id });
    
    // Delete the role
    await Role.findByIdAndDelete(req.params.id);
    
    req.session.successMessage = "Role deleted successfully!";
    res.redirect(res.locals.base + "admin/roles");
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete role!";
    res.redirect(res.locals.base + "admin/roles");
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
  destroy
};