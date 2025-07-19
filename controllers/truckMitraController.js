const mongoose = require("mongoose");
const TruckMitra = mongoose.model(
  "TruckMitra",
  require("../schemas/truckMitraSchema")
);

const index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const type = req.query.type || "";

    let query = {};

    if (search) {
      query = {
        $or: [
          { firstname: { $regex: search, $options: "i" } },
          { lastname: { $regex: search, $options: "i" } },
          { "contact.noPhone": { $regex: search, $options: "i" } },
          { "identitasKendaraan.noPolisi": { $regex: search, $options: "i" } },
        ],
      };
    }

    if (type) {
      query.type = type;
    }

    const [truckMitras, total] = await Promise.all([
      TruckMitra.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      TruckMitra.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.render("../views/pages/administrasi/truck-mitra/index.ejs", {
      title: "Truck Mitra",
      truckMitras,
      name: "truck-mitra",
      search,
      currentPage: page,
      limit,
      total,
      totalPages,
      selectedType: type,
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load truck mitra!";
    res.redirect(res.locals.base + "dashboard/analytics/" + res.getLocale());
  }
};

const create = async (req, res) => {
  try {
    res.render("../views/pages/administrasi/truck-mitra/create.ejs", {
      title: "Create Truck Mitra",
      name: "truck-mitra",
      errors: null,
      input: {},
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load form!";
    res.redirect(
      res.locals.base + "administrasi/truck-mitra/index/" + res.getLocale()
    );
  }
};

const store = async (req, res) => {
  try {
    const truckMitra = new TruckMitra({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      birthdate: req.body.birthdate,
      gender: req.body.gender,
      contact: {
        noPhone: req.body.noPhone,
        noPhoneEmergency: req.body.noPhoneEmergency,
        noPhoneContact: req.body.noPhoneContact,
      },
      type: req.body.type,
      address: {
        street: req.body.street,
        city: req.body.city,
        district: req.body.district,
        province: req.body.province,
        postalCode: req.body.postalCode,
      },
      joinDate: req.body.joinDate,
      noKTP: req.body.noKTP,
      noSIM: req.body.noSIM,
      identitasKendaraan: {
        noPolisi: req.body.noPolisi,
        noSTNK: req.body.noSTNK,
        jenisKendaraan: req.body.jenisKendaraan,
        modelKendaraan: req.body.modelKendaraan,
      },
      status: "Active",
      createdBy: req.session.user ? req.session.user._id : null,
    });

    await truckMitra.save();
    req.session.successMessage = "Truck mitra created successfully!";
    res.redirect(
      res.locals.base + "administrasi/truck-mitra/index/" + res.getLocale()
    );
  } catch (error) {
    console.error(error);
    req.session.errorMessage = error.message || "Failed to create truck mitra!";
    res.redirect(
      res.locals.base + "administrasi/truck-mitra/create/" + res.getLocale()
    );
  }
};

// View delivery history
const deliveryHistory = async (req, res) => {
  try {
    const truckMitra = await TruckMitra.findById(req.params.id)
      .populate("deliveryLogs.branchOrigin", "name code")
      .populate("deliveryLogs.branchDestination", "name code");

    if (!truckMitra) {
      req.session.errorMessage = "Truck mitra not found!";
      return res.redirect(
        res.locals.base + "administrasi/truck-mitra/index/" + res.getLocale()
      );
    }

    res.render("../views/pages/administrasi/truck-mitra/delivery-history.ejs", {
      title: "Delivery History",
      truckMitra,
      name: "truck-mitra",
    });
  } catch (error) {
    console.error(error);
    req.session.errorMessage = "Failed to load delivery history!";
    res.redirect(
      res.locals.base + "administrasi/truck-mitra/index/" + res.getLocale()
    );
  }
};

// Update tracking location
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude, speed, status } = req.body;

    const truckMitra = await TruckMitra.findById(req.params.id);
    if (!truckMitra) {
      return res.status(404).json({ error: "Truck mitra not found!" });
    }

    truckMitra.trackingHistory.push({
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      speed,
      status,
    });

    // Keep only last 100 tracking points
    if (truckMitra.trackingHistory.length > 100) {
      truckMitra.trackingHistory = truckMitra.trackingHistory.slice(-100);
    }

    await truckMitra.save();
    res.json({ success: true, message: "Location updated!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update location!" });
  }
};

// Log activity
const logActivity = async (req, res) => {
  try {
    const { activity, description } = req.body;

    const truckMitra = await TruckMitra.findById(req.params.id);
    if (!truckMitra) {
      return res.status(404).json({ error: "Truck mitra not found!" });
    }

    truckMitra.activityLogs.push({
      activity,
      description,
      recordedBy: req.session.user ? req.session.user._id : null,
    });

    await truckMitra.save();
    res.json({ success: true, message: "Activity logged!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to log activity!" });
  }
};

module.exports = {
  index,
  create,
  store,
  deliveryHistory,
  updateLocation,
  logActivity,
};
