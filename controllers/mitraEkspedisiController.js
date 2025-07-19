const mongoose = require("mongoose");
const ListMitraEkspedisi = mongoose.model(
  "ListMitraEkspedisi",
  require("../schemas/listMitraEkspedisiSchema")
);
const AreaMitraEkspedisi = mongoose.model(
  "AreaMitraEkspedisi",
  require("../schemas/areaMitraEkspedisiSchema")
);

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
          { contactPerson: { $regex: search, $options: "i" } },
        ],
      };
    }

    const [mitras, total] = await Promise.all([
      ListMitraEkspedisi.find(query).sort({ name: 1 }).skip(skip).limit(limit),
      ListMitraEkspedisi.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render("../views/pages/administrasi/mitra-ekspedisi/index.ejs", {
      title: "Mitra Ekspedisi",
      mitras,
      name: "mitra-ekspedisi",
      search,
      currentPage: page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load mitra ekspedisi!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

const create = async (req, res) => {
  try {
    res.render("../views/pages/administrasi/mitra-ekspedisi/create.ejs", {
      title: "Create Mitra Ekspedisi",
      name: "mitra-ekspedisi",
      errors: null,
      input: {},
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load form!";
    res.redirect(
      res.locals.base + "administrasi/mitra-ekspedisi/index/" + res.getLocale()
    );
  }
};

const store = async (req, res) => {
  try {
    const mitra = new ListMitraEkspedisi({
      name: req.body.name,
      code: req.body.code.toUpperCase(),
      address: req.body.address,
      phone: req.body.phone,
      email: req.body.email,
      contactPerson: req.body.contactPerson,
      status: req.body.status || "Active",
      daftarHarga: req.body.daftarHarga,
      description: req.body.description,
      createdBy: req.session.user ? req.session.user._id : null,
    });

    await mitra.save();
    req.session.successMessage = "Mitra ekspedisi created successfully!";
    res.redirect(
      res.locals.base + "administrasi/mitra-ekspedisi/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage =
      error.message || "Failed to create mitra ekspedisi!";
    res.redirect(
      res.locals.base + "administrasi/mitra-ekspedisi/create/" + res.getLocale()
    );
  }
};

// Manage mitra areas
const manageAreas = async (req, res) => {
  try {
    const mitra = await ListMitraEkspedisi.findById(req.params.id);
    if (!mitra) {
      req.session.errorMessage = "Mitra not found!";
      return res.redirect(
        res.locals.base +
          "administrasi/mitra-ekspedisi/index/" +
          res.getLocale()
      );
    }

    const areas = await AreaMitraEkspedisi.find({
      ekspedisiId: mitra._id,
    }).sort({ province: 1, city: 1 });

    res.render("../views/pages/administrasi/mitra-ekspedisi/areas.ejs", {
      title: "Manage Mitra Areas",
      mitra,
      areas,
      name: "mitra-ekspedisi",
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load areas!";
    res.redirect(
      res.locals.base + "administrasi/mitra-ekspedisi/index/" + res.getLocale()
    );
  }
};

// Add area to mitra
const addArea = async (req, res) => {
  try {
    const area = new AreaMitraEkspedisi({
      ekspedisiId: req.params.id,
      province: req.body.province,
      city: req.body.city,
      district: req.body.district,
      subDistrict: req.body.subDistrict,
      postalCode: req.body.postalCode,
      status: req.body.status || "Active",
      createdBy: req.session.user ? req.session.user._id : null,
    });

    await area.save();
    res.json({ success: true, message: "Area added successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Failed to add area!" });
  }
};

module.exports = {
  index,
  create,
  store,
  manageAreas,
  addArea,
};
