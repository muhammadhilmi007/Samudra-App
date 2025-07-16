const { name } = require("ejs");
const mongoose = require("mongoose");
const Module = mongoose.model("Module", require("../schemas/moduleSchema"));
const Permission = mongoose.model(
  "Permission",
  require("../schemas/permissionSchema")
);

// List all modules
const index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // build query search
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      };
      console.log("Search query module:", query);
    }

    const [modules, total] = await Promise.all([
      Module.find(query)
        .populate("parent_id")
        .sort({ order: 1, name: 1 })
        .skip(skip)
        .limit(limit),
      Module.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render("../views/pages/settings/modules/index.ejs", {
      title: "Modules",
      modules: modules,
      layout: "../views/layout/app.ejs",
      name: "modules",
      search: search,
      currentPage: page,
      limit: limit,
      total: total,
      totalPages: totalPages,
      parentModules: await Module.find({ isActive: true, parent_id: null }),
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
      parent_id: null,
    }).sort({ order: 1 });

    res.render("../views/pages/settings/modules/index.ejs", {
      title: "Create Module",
      parentModules: parentModules,
      layout: "../views/layout/app.ejs",
      name: "modules",
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load form data!";
    res.redirect(
      process.env.BASE_URL + "settings/modules/index/" + res.getLocale()
    );
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
      isActive: req.body.isActive === "on",
    });

    await module.save();

    // Create default permissions for this module
    const defaultActions = ["create", "read", "update", "delete"];
    for (const action of defaultActions) {
      await Permission.create({
        module_name: module.name,
        module_code: module.code,
        action: action,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${
          module.name
        }`,
        isActive: true,
      });
    }

    req.session.successMessage = "Module created successfully!";
    res.redirect(
      process.env.BASE_URL + "settings/modules/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    const parentModules = await Module.find({
      isActive: true,
      parent_id: null,
    }).sort({ order: 1 });

    res.render("../views/pages/settings/modules/create", {
      title: "Create Module",
      parentModules: parentModules,
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body,
    });
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/modules/index/" + res.getLocale()
      );
    }

    const parentModules = await Module.find({
      isActive: true,
      parent_id: null,
      _id: { $ne: module._id },
    }).sort({ order: 1 });

    res.render("../views/pages/settings/modules/edit", {
      title: "Edit Module",
      module: module,
      parentModules: parentModules,
      layout: "../views/layout/app.ejs",
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load module!";
    res.redirect(
      process.env.BASE_URL + "settings/modules/index/" + res.getLocale()
    );
  }
};

// Update module
const update = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/modules/index/" + res.getLocale()
      );
    }

    const oldCode = module.code;

    module.name = req.body.name;
    module.code = req.body.code;
    module.description = req.body.description;
    module.icon = req.body.icon;
    module.order = parseInt(req.body.order) || 0;
    module.parent_id = req.body.parent_id || null;
    module.route = req.body.route;
    module.isActive = req.body.isActive === "on";

    await module.save();

    // Update permissions if module code changed
    if (oldCode !== module.code) {
      await Permission.updateMany(
        { module_code: oldCode },
        { module_code: module.code, module_name: module.name }
      );
    }

    req.session.successMessage = "Module updated successfully!";
    res.redirect(
      process.env.BASE_URL + "settings/modules/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    const parentModules = await Module.find({
      isActive: true,
      parent_id: null,
      _id: { $ne: module._id },
    }).sort({ order: 1 });

    res.render("../views/pages/settings/modules/edit", {
      title: "Edit Module",
      module: module,
      parentModules: parentModules,
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body,
    });
  }
};

// Manage module permissions - PERBAIKAN
const permissions = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/modules/index/" + req.params.language
      );
    }

    const permissions = await Permission.find({ module_code: module.code });

    res.render("../views/pages/settings/modules/permissions", {
      title: "Module Permissions",
      module: module,
      permissions: permissions,
      layout: "../views/layout/app.ejs",
      name: "modules",
      locale: req.params.language, // Tambahkan locale ke context
    });
  } catch (error) {
    console.error("Error loading permissions:", error);
    req.session.errorMessage = "Failed to load permissions!";
    res.redirect(
      process.env.BASE_URL + "settings/modules/index/" + req.params.language
    );
  }
};

// Add new permission to module - PERBAIKAN
const addPermission = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/modules/index/" + req.params.language
      );
    }

    // Check if permission already exists
    const existingPermission = await Permission.findOne({
      module_code: module.code,
      action: req.body.action,
    });

    if (existingPermission) {
      req.session.errorMessage = "Permission with this action already exists!";
      return res.redirect(
        process.env.BASE_URL +
          "settings/modules/permissions/" +
          module._id +
          "/" +
          req.params.language
      );
    }

    await Permission.create({
      module_name: module.name,
      module_code: module.code,
      action: req.body.action,
      description: req.body.description,
      isActive: req.body.isActive === "on",
    });

    req.session.successMessage = "Permission added successfully!";
    res.redirect(
      process.env.BASE_URL +
        "settings/modules/permissions/" +
        module._id +
        "/" +
        req.params.language
    );
  } catch (error) {
    console.error("Error adding permission:", error);
    req.session.errorMessage = "Failed to add permission!";
    res.redirect(
      process.env.BASE_URL +
        "settings/modules/permissions/" +
        req.params.id +
        "/" +
        req.params.language
    );
  }
};

// Delete module permission - PERBAIKAN
const deletePermission = async (req, res) => {
  try {
    const moduleId = req.params.id;
    const permissionId = req.params.permission_id;
    const locale = req.params.language;

    // Validasi module exists
    const module = await Module.findById(moduleId);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/modules/index/" + locale
      );
    }

    // Validasi permission exists
    const permission = await Permission.findById(permissionId);
    if (!permission) {
      req.session.errorMessage = "Permission not found!";
      return res.redirect(
        process.env.BASE_URL +
          "settings/modules/permissions/" +
          moduleId +
          "/" +
          locale
      );
    }

    // Validasi permission belongs to module
    if (permission.module_code !== module.code) {
      req.session.errorMessage = "Permission does not belong to this module!";
      return res.redirect(
        process.env.BASE_URL +
          "settings/modules/permissions/" +
          moduleId +
          "/" +
          locale
      );
    }

    // Delete permission
    await Permission.findByIdAndDelete(permissionId);

    req.session.successMessage = "Permission deleted successfully!";
    res.redirect(
      process.env.BASE_URL +
        "settings/modules/permissions/" +
        moduleId +
        "/" +
        locale
    );
  } catch (error) {
    console.error("Error deleting permission:", error);
    req.session.errorMessage = "Failed to delete permission!";
    res.redirect(
      process.env.BASE_URL +
        "settings/modules/permissions/" +
        req.params.id +
        "/" +
        req.params.language
    );
  }
};

// Delete module
const destroy = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      req.session.errorMessage = "Module not found!";
      return res.redirect(
        process.env.BASE_URL + "settings/modules/index/" + res.getLocale()
      );
    }

    // Delete related permissions
    await Permission.deleteMany({ module_code: module.code });

    // Delete the module
    await Module.findByIdAndDelete(req.params.id);

    req.session.successMessage = "Module deleted successfully!";
    res.redirect(
      process.env.BASE_URL + "settings/modules/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete module!";
    res.redirect(
      process.env.BASE_URL + "settings/modules/index/" + res.getLocale()
    );
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
  deletePermission,
  destroy,
};
