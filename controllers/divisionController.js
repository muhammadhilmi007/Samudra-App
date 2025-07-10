const mongoose = require("mongoose");
const Division = mongoose.model(
  "Division",
  require("../schemas/divisionSchema")
);

// List all divisions
const index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    // Build query search
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [divisions, total] = await Promise.all([
      Division.find(query).sort({ name: 1 }).skip(skip).limit(limit),
      Division.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render("../views/pages/administrasi/division/index.ejs", {
      title: "Divisi",
      divisions: divisions,
      layout: "../views/layout/app.ejs",
      name: "index",
      currentPage: page,
      totalPages: totalPages,
      limit: limit,
      total: total,
      search: search,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load divisions!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

// Show create form
const create = (req, res) => {
  res.render("../views/pages/administrasi/division/create", {
    title: "Create Division",
    layout: "../views/layout/app.ejs",
  });
};

// Store new division
const store = async (req, res) => {
  try {
    const division = new Division({
      name: req.body.name,
      code: req.body.code.toUpperCase(),
      description: req.body.description,
      isActive: req.body.isActive === "on",
    });

    await division.save();
    req.session.successMessage = "Division created successfully!";
    res.redirect(
      process.env.BASE_URL + "administrasi/divisi/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    res.render("../views/pages/administrasi/division/create.ejs", {
      title: "Create Division",
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body,
    });
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const division = await Division.findById(req.params.id);
    if (!division) {
      req.session.errorMessage = "Division not found!";
      return res.redirect(
        process.env.BASE_URL + "administrasi/divisi/index/" + res.getLocale()
      );
    }

    res.render("../views/pages/administrasi/divisi/edit", {
      title: "Edit Division",
      division: division,
      layout: "../views/layout/app.ejs",
    });
  } catch (error) {
    console.log(error);
    req.session.errorMessage = "Failed to load division!";
    res.redirect(
      process.env.BASE_URL + "administrasi/divisi/index/" + res.getLocale()
    );
  }
};

// Update division
const update = async (req, res) => {
  try {
    const division = await Division.findById(req.params.id);
    if (!division) {
      req.session.errorMessage = "Division not found!";
      return res.redirect(
        process.env.BASE_URL + "administrasi/divisi/index/" + res.getLocale()
      );
    }

    division.name = req.body.name;
    division.code = req.body.code.toUpperCase();
    division.description = req.body.description;
    division.isActive = req.body.isActive === "on";

    await division.save();
    req.session.successMessage = "Division updated successfully!";
    res.redirect(
      process.env.BASE_URL + "administrasi/divisi/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    res.render("../views/pages/administrasi/divisi/edit", {
      title: "Edit Division",
      division: Division,
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body,
    });
  }
};

// Delete division
const destroy = async (req, res) => {
  try {
    // Check if division is being used
    const Role = mongoose.model("Role", require("../schemas/roleSchema"));
    const User = mongoose.model("User", require("../schemas/userSchema"));

    const rolesCount = await Role.countDocuments({
      division_id: req.params.id,
    });
    const usersCount = await User.countDocuments({
      division_id: req.params.id,
    });

    if (rolesCount > 0 || usersCount > 0) {
      req.session.errorMessage =
        "Cannot delete division! It is being used by roles or users.";
      return res.redirect(
        process.env.BASE_URL + "administrasi/divisi/index/" + res.getLocale()
      );
    }

    await Division.findByIdAndDelete(req.params.id);
    req.session.successMessage = "Division deleted successfully!";
    res.redirect(
      process.env.BASE_URL + "administrasi/divisi/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete division!";
    res.redirect(
      process.env.BASE_URL + "administrasi/divisi/index/" + res.getLocale()
    );
  }
};

module.exports = {
  index,
  create,
  store,
  edit,
  update,
  destroy,
};
