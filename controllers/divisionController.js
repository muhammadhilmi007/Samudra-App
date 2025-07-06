const mongoose = require("mongoose");
const Division = mongoose.model("Division", require("../schemas/divisionSchema"));

// List all divisions
const index = async (req, res) => {
  try {
    const divisions = await Division.find().sort({ name: 1 });
    res.render("../views/admin/divisions/index", {
      title: "Divisions",
      divisions: divisions,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load divisions!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

// Show create form
const create = (req, res) => {
  res.render("../views/admin/divisions/create", {
    title: "Create Division",
    layout: "../views/layout/app.ejs"
  });
};

// Store new division
const store = async (req, res) => {
  try {
    const division = new Division({
      name: req.body.name,
      code: req.body.code.toUpperCase(),
      description: req.body.description,
      isActive: req.body.isActive === 'on'
    });

    await division.save();
    req.session.successMessage = "Division created successfully!";
    res.redirect(res.locals.base + "admin/divisions");
  } catch (error) {
    console.error(error);
    res.render("../views/admin/divisions/create", {
      title: "Create Division",
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body
    });
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const division = await Division.findById(req.params.id);
    if (!division) {
      req.session.errorMessage = "Division not found!";
      return res.redirect(res.locals.base + "admin/divisions");
    }

    res.render("../views/admin/divisions/edit", {
      title: "Edit Division",
      division: division,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load division!";
    res.redirect(res.locals.base + "admin/divisions");
  }
};

// Update division
const update = async (req, res) => {
  try {
    const division = await Division.findById(req.params.id);
    if (!division) {
      req.session.errorMessage = "Division not found!";
      return res.redirect(res.locals.base + "admin/divisions");
    }

    division.name = req.body.name;
    division.code = req.body.code.toUpperCase();
    division.description = req.body.description;
    division.isActive = req.body.isActive === 'on';

    await division.save();
    req.session.successMessage = "Division updated successfully!";
    res.redirect(res.locals.base + "admin/divisions");
  } catch (error) {
    console.error(error);
    res.render("../views/admin/divisions/edit", {
      title: "Edit Division",
      division: division,
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body
    });
  }
};

// Delete division
const destroy = async (req, res) => {
  try {
    // Check if division is being used
    const Role = mongoose.model("Role", require("../schemas/roleSchema"));
    const User = mongoose.model("User", require("../schemas/userSchema"));
    
    const rolesCount = await Role.countDocuments({ division_id: req.params.id });
    const usersCount = await User.countDocuments({ division_id: req.params.id });
    
    if (rolesCount > 0 || usersCount > 0) {
      req.session.errorMessage = "Cannot delete division! It is being used by roles or users.";
      return res.redirect(res.locals.base + "admin/divisions");
    }

    await Division.findByIdAndDelete(req.params.id);
    req.session.successMessage = "Division deleted successfully!";
    res.redirect(res.locals.base + "admin/divisions");
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete division!";
    res.redirect(res.locals.base + "admin/divisions");
  }
};

module.exports = {
  index,
  create,
  store,
  edit,
  update,
  destroy
};