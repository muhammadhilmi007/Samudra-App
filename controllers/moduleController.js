const mongoose = require("mongoose");
const Module = mongoose.model("Module", require("../schemas/moduleSchema"));
const Permission = mongoose.model("Permission", require("../schemas/permissionSchema"));

// List all modules
const index = async (req, res) => {
  try {
    const modules = await Module.find()
      .populate('parent_id')
      .sort({ order: 1, name: 1 });

    res.render("../views/admin/modules/index", {
      title: "Modules",
      modules: modules,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load modules!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

// Show create form
const create = async (req, res) => {
  try {
    const parentModules = await Module.find({ 
      isActive: true, 
      parent_id: null 
    }).sort({ order: 1 });

    res.render("../views/admin/modules/create", {
      title: "Create Module",
      parentModules: parentModules,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load form data!";
    res.redirect(res.locals.base + "admin/modules");
  }
};

// Store new module
const store = async (req, res) => {
  try {
    const module = new Module({
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      icon: req.body.icon,
      order: parseInt(req.body.order) || 0,
      parent_id: req.body.parent_id || null,
      route: req.body.route,
      isActive: req.body.isActive === 'on'
    });

    await module.save();

    // Create default permissions for this module
    const defaultActions = ['create', 'read', 'update', 'delete'];
    for (const action of defaultActions) {
      await Permission.create({
        module_name: module.name,
        module_code: module.code,
        action: action,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${module.name}`,
        isActive: true
      });
    }

    req.session.successMessage = "Module created successfully!";
    res.redirect(res.locals.base + "admin/modules");
  } catch (error) {
    console.error(error);
    const parentModules = await Module.find({ 
      isActive: true, 
      parent_id: null 
    }).sort({ order: 1 });

    res.render("../views/admin/modules/create", {
      title: "Create Module",
      parentModules: parentModules,
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body
    });
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(res.locals.base + "admin/modules");
    }

    const parentModules = await Module.find({ 
      isActive: true, 
      parent_id: null,
      _id: { $ne: module._id }
    }).sort({ order: 1 });

    res.render("../views/admin/modules/edit", {
      title: "Edit Module",
      module: module,
      parentModules: parentModules,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load module!";
    res.redirect(res.locals.base + "admin/modules");
  }
};

// Update module
const update = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(res.locals.base + "admin/modules");
    }

    const oldCode = module.code;
    
    module.name = req.body.name;
    module.code = req.body.code;
    module.description = req.body.description;
    module.icon = req.body.icon;
    module.order = parseInt(req.body.order) || 0;
    module.parent_id = req.body.parent_id || null;
    module.route = req.body.route;
    module.isActive = req.body.isActive === 'on';

    await module.save();

    // Update permissions if module code changed
    if (oldCode !== module.code) {
      await Permission.updateMany(
        { module_code: oldCode },
        { module_code: module.code, module_name: module.name }
      );
    }

    req.session.successMessage = "Module updated successfully!";
    res.redirect(res.locals.base + "admin/modules");
  } catch (error) {
    console.error(error);
    const parentModules = await Module.find({ 
      isActive: true, 
      parent_id: null,
      _id: { $ne: module._id }
    }).sort({ order: 1 });

    res.render("../views/admin/modules/edit", {
      title: "Edit Module",
      module: module,
      parentModules: parentModules,
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body
    });
  }
};

// Manage module permissions
const permissions = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(res.locals.base + "admin/modules");
    }

    const permissions = await Permission.find({ module_code: module.code });

    res.render("../views/admin/modules/permissions", {
      title: "Module Permissions",
      module: module,
      permissions: permissions,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load permissions!";
    res.redirect(res.locals.base + "admin/modules");
  }
};

// Add new permission to module
const addPermission = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(res.locals.base + "admin/modules");
    }

    await Permission.create({
      module_name: module.name,
      module_code: module.code,
      action: req.body.action,
      description: req.body.description,
      isActive: req.body.isActive === 'on'
    });

    req.session.successMessage = "Permission added successfully!";
    res.redirect(res.locals.base + "admin/modules/permissions/" + module._id);
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to add permission!";
    res.redirect(res.locals.base + "admin/modules/permissions/" + req.params.id);
  }
};

// Delete module
const destroy = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(res.locals.base + "admin/modules");
    }

    // Delete related permissions
    await Permission.deleteMany({ module_code: module.code });
    
    // Delete the module
    await Module.findByIdAndDelete(req.params.id);
    
    req.session.successMessage = "Module deleted successfully!";
    res.redirect(res.locals.base + "admin/modules");
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete module!";
    res.redirect(res.locals.base + "admin/modules");
  }
};

module.exports = {
  index,
  create,
  store,
  edit,
  update,
  permissions,
  addPermission,
  destroy
};