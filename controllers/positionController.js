const mongoose = require("mongoose");
const Position = mongoose.model("Position", require("../schemas/positionSchema"));

// List all positions
const index = async (req, res) => {
  try {
    const positions = await Position.find().sort({ level: 1, name: 1 });
    res.render("../views/admin/positions/index", {
      title: "Positions",
      positions: positions,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load positions!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

// Show create form
const create = (req, res) => {
  res.render("../views/admin/positions/create", {
    title: "Create Position",
    layout: "../views/layout/app.ejs"
  });
};

// Store new position
const store = async (req, res) => {
  try {
    const position = new Position({
      name: req.body.name,
      code: req.body.code.toUpperCase(),
      level: parseInt(req.body.level),
      description: req.body.description,
      isActive: req.body.isActive === 'on'
    });

    await position.save();
    req.session.successMessage = "Position created successfully!";
    res.redirect(res.locals.base + "admin/positions");
  } catch (error) {
    console.error(error);
    res.render("../views/admin/positions/create", {
      title: "Create Position",
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body
    });
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const position = await Position.findById(req.params.id);
    if (!position) {
      req.session.errorMessage = "Position not found!";
      return res.redirect(res.locals.base + "admin/positions");
    }

    res.render("../views/admin/positions/edit", {
      title: "Edit Position",
      position: position,
      layout: "../views/layout/app.ejs"
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load position!";
    res.redirect(res.locals.base + "admin/positions");
  }
};

// Update position
const update = async (req, res) => {
  try {
    const position = await Position.findById(req.params.id);
    if (!position) {
      req.session.errorMessage = "Position not found!";
      return res.redirect(res.locals.base + "admin/positions");
    }

    position.name = req.body.name;
    position.code = req.body.code.toUpperCase();
    position.level = parseInt(req.body.level);
    position.description = req.body.description;
    position.isActive = req.body.isActive === 'on';

    await position.save();
    req.session.successMessage = "Position updated successfully!";
    res.redirect(res.locals.base + "admin/positions");
  } catch (error) {
    console.error(error);
    res.render("../views/admin/positions/edit", {
      title: "Edit Position",
      position: position,
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body
    });
  }
};

// Delete position
const destroy = async (req, res) => {
  try {
    // Check if position is being used
    const Role = mongoose.model("Role", require("../schemas/roleSchema"));
    const User = mongoose.model("User", require("../schemas/userSchema"));
    
    const rolesCount = await Role.countDocuments({ position_id: req.params.id });
    const usersCount = await User.countDocuments({ position_id: req.params.id });
    
    if (rolesCount > 0 || usersCount > 0) {
      req.session.errorMessage = "Cannot delete position! It is being used by roles or users.";
      return res.redirect(res.locals.base + "admin/positions");
    }

    await Position.findByIdAndDelete(req.params.id);
    req.session.successMessage = "Position deleted successfully!";
    res.redirect(res.locals.base + "admin/positions");
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete position!";
    res.redirect(res.locals.base + "admin/positions");
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