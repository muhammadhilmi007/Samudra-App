const mongoose = require("mongoose");
const Branch = mongoose.model("Branch", require("../schemas/branchSchema"));

// List all branches
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
          { address: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [branches, total] = await Promise.all([
      Branch.find(query).sort({ name: 1 }).skip(skip).limit(limit),
      Branch.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render("../views/pages/administrasi/branches/index.ejs", {
      title: "View Branches",
      branches: branches,
      layout: "../views/layout/app.ejs",
      name: "branches",
      search: search,
      currentPage: page,
      limit: limit,
      total: total,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load branches!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

// Show create form
const create = (req, res) => {
  res.render("../views/pages/administrasi/branches/create", {
    title: "Create Branch",
    layout: "../views/layout/app.ejs",
  });
};

// Store new branch
const store = async (req, res) => {
  try {
    const branch = new Branch({
      name: req.body.name,
      code: req.body.code,
      address: req.body.address,
      phone: req.body.phone,
      type: req.body.type || "cabang",
      isActive: req.body.isActive === "on",
    });

    await branch.save();
    req.session.successMessage = "Branch created successfully!";
    res.redirect(
      process.env.BASE_URL + "administrasi/branches/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    res.render("../views/pages/administrasi/branches/create", {
      title: "Create Branch",
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body,
    });
  }
};

// Show edit form
const edit = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      req.session.errorMessage = "Branch not found!";
      return res.redirect(res.locals.base + "admin/branches");
    }

    res.render("../views/admin/branches/edit", {
      title: "Edit Branch",
      branch: branch,
      layout: "../views/layout/app.ejs",
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load branch!";
    res.redirect(res.locals.base + "admin/branches");
  }
};

// Update branch
const update = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      req.session.errorMessage = "Branch not found!";
      return res.redirect(res.locals.base + "admin/branches");
    }

    branch.name = req.body.name;
    branch.code = req.body.code;
    branch.address = req.body.address;
    branch.phone = req.body.phone;
    branch.type = req.body.type || "cabang";
    branch.isActive = req.body.isActive === "on";

    await branch.save();
    req.session.successMessage = "Branch updated successfully!";
    res.redirect(res.locals.base + "admin/branches");
  } catch (error) {
    console.error(error);
    res.render("../views/admin/branches/edit", {
      title: "Edit Branch",
      branch: branch,
      layout: "../views/layout/app.ejs",
      errors: error.errors,
      input: req.body,
    });
  }
};

// Delete branch
const destroy = async (req, res) => {
  try {
    await Branch.findByIdAndDelete(req.params.id);
    req.session.successMessage = "Branch deleted successfully!";
    res.redirect(res.locals.base + "admin/branches");
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete branch!";
    res.redirect(res.locals.base + "admin/branches");
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
