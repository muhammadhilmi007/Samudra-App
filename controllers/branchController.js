const mongoose = require("mongoose");
const Branch = mongoose.model("Branch", require("../schemas/branchSchema"));
const Employee = mongoose.model(
  "Employee",
  require("../schemas/employeeSchema")
);

// List all branches
const index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { code: { $regex: search, $options: "i" } },
          { "address.city": { $regex: search, $options: "i" } },
          { "contact.phone": { $regex: search, $options: "i" } },
        ],
      };
    }

    const [branches, total] = await Promise.all([
      Branch.find(query)
        .populate("manager", "name")
        .populate("parent", "name")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Branch.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render("../views/pages/administrasi/branches/index.ejs", {
      title: "View Branches",
      branches,
      layout: "../views/layout/app.ejs",
      name: "branches",
      search,
      currentPage: page,
      limit,
      total,
      totalPages,
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
      type: req.body.type || "cabang",
      address: {
        street: req.body.street,
        city: req.body.city,
        district: req.body.district,
        province: req.body.province,
        postalCode: req.body.postalCode,
        country: req.body.country || "Indonesia",
      },
      contact: {
        phone: req.body.phone,
        email: req.body.email,
        fax: req.body.fax,
      },
      manager: req.body.manager || null,
      parent: req.body.parent || null,
      location: {
        type: "Point",
        coordinates: [
          parseFloat(req.body.longitude) || 0,
          parseFloat(req.body.latitude) || 0,
        ],
      },
      isActive: req.body.isActive || "active",
      createdBy: req.user ? req.user._id : null,
    });

    await branch.save();
    req.session.successMessage = "Branch created successfully!";
    res.redirect(
      res.locals.base + "administrasi/branches/index/" + res.getLocale()
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
      return res.redirect(
        res.locals.base + "administrasi/branches/index/" + res.getLocale()
      );
    }

    res.render("../views/pages/administrasi/branches/edit", {
      title: "Edit Branch",
      layout: "../views/layout/app.ejs",
      branch,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load branch!";
    res.redirect(
      res.locals.base + "administrasi/branches/index/" + res.getLocale()
    );
  }
};

// Update branch
const update = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      req.session.errorMessage = "Branch not found!";
      return res.redirect(
        res.locals.base + "administrasi/branches/index/" + res.getLocale()
      );
    }

    branch.name = req.body.name;
    branch.code = req.body.code;
    branch.type = req.body.type || "cabang";
    branch.address = {
      street: req.body.street,
      city: req.body.city,
      district: req.body.district,
      province: req.body.province,
      postalCode: req.body.postalCode,
      country: req.body.country || "Indonesia",
    };
    branch.contact = {
      phone: req.body.phone,
      email: req.body.email,
      fax: req.body.fax,
    };
    branch.manager = req.body.manager || null;
    branch.parent = req.body.parent || null;
    branch.location = {
      type: "Point",
      coordinates: [
        parseFloat(req.body.longitude) || 0,
        parseFloat(req.body.latitude) || 0,
      ],
    };
    branch.isActive = req.body.isActive || "active";
    branch.updatedBy = req.user ? req.user._id : null;

    await branch.save();
    req.session.successMessage = "Branch updated successfully!";
    res.redirect(
      res.locals.base + "administrasi/branches/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    res.render("../views/pages/administrasi/branches/edit", {
      title: "Edit Branch",
      layout: "../views/layout/app.ejs",
      branch,
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
    res.redirect(
      res.locals.base + "administrasi/branches/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to delete branch!";
    res.redirect(
      res.locals.base + "administrasi/branches/index/" + res.getLocale()
    );
  }
};

const getLocation = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch || !branch.location) {
      return res.status(404).json({ error: "Branch or location not found" });
    }
    res.json(branch.location);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch location", details: error.message });
  }
};

const getParentBranches = async (req, res) => {
  try {
    const branches = await Branch.find({}, "_id name code").sort("name");
    res.json(branches);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch parent branches",
      details: error.message,
    });
  }
};

const getManagers = async (req, res) => {
  try {
    const search = req.query.q || "";
    const regex = new RegExp(search, "i");

    const employees = await Employee.find(
      { name: regex },
      "_id name position"
    ).limit(10);

    res.json(employees);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch managers", details: error.message });
  }
};

const getBranches = async (req, res) => {
  try {
    const keyword = req.query.q || "";
    const regex = new RegExp(keyword, "i");

    const branches = await Branch.find(
      {
        $or: [{ name: regex }, { code: regex }, { "address.city": regex }],
      },
      "_id name code address"
    ).limit(10);

    res.json(branches);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch branches", details: error.message });
  }
};

module.exports = {
  index,
  create,
  store,
  edit,
  update,
  destroy,
  getLocation,
  getParentBranches,
  getManagers,
  getBranches,
};
