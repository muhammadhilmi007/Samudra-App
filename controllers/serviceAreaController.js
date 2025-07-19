const mongoose = require("mongoose");
const ServiceArea = mongoose.model(
  "ServiceArea",
  require("../schemas/serviceAreaSchema")
);
const Branch = mongoose.model("Branch", require("../schemas/branchSchema"));

const index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const branch = req.query.branch || "";

    let query = {};

    if (search) {
      query = {
        $or: [
          { province: { $regex: search, $options: "i" } },
          { city: { $regex: search, $options: "i" } },
          { district: { $regex: search, $options: "i" } },
          { postalCode: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (branch) {
      query.branchId = branch;
    }

    const [serviceAreas, total] = await Promise.all([
      ServiceArea.find(query)
        .populate("branchId", "name code")
        .sort({ province: 1, city: 1 })
        .skip(skip)
        .limit(limit),
      ServiceArea.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);
    const branches = await Branch.find({ isActive: "active" }).sort({
      name: 1,
    });

    res.render("../views/pages/administrasi/service-areas/index.ejs", {
      title: "Service Areas",
      serviceAreas,
      branches,
      name: "service-areas",
      search,
      currentPage: page,
      limit,
      total,
      totalPages,
      selectedBranch: branch,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load service areas!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

const create = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: "active" }).sort({
      name: 1,
    });

    res.render("../views/pages/administrasi/service-areas/create.ejs", {
      title: "Create Service Area",
      branches,
      name: "service-areas",
      errors: null,
      input: {},
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load form data!";
    res.redirect(
      res.locals.base + "administrasi/service-areas/index/" + res.getLocale()
    );
  }
};

const store = async (req, res) => {
  try {
    const serviceArea = new ServiceArea({
      branchId: req.body.branchId,
      province: req.body.province,
      city: req.body.city,
      district: req.body.district,
      subDistrict: req.body.subDistrict,
      postalCode: req.body.postalCode,
      status: req.body.status || "Active",
      createdBy: req.session.user ? req.session.user._id : null,
    });

    await serviceArea.save();
    req.session.successMessage = "Service area created successfully!";
    res.redirect(
      res.locals.base + "administrasi/service-areas/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage =
      error.message || "Failed to create service area!";
    res.redirect(
      res.locals.base + "administrasi/service-areas/create/" + res.getLocale()
    );
  }
};

// Bulk import service areas
const bulkImport = async (req, res) => {
  try {
    const { branchId, areas } = req.body;

    const serviceAreas = areas.map((area) => ({
      branchId,
      province: area.province,
      city: area.city,
      district: area.district,
      subDistrict: area.subDistrict,
      postalCode: area.postalCode,
      status: "Active",
      createdBy: req.session.user ? req.session.user._id : null,
    }));

    await ServiceArea.insertMany(serviceAreas, { ordered: false });
    res.json({
      success: true,
      message: "Service areas imported successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to import service areas!" });
  }
};

module.exports = {
  index,
  create,
  store,
  bulkImport,
};
