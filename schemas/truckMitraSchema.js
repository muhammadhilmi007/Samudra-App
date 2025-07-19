const mongoose = require("mongoose");

const deliveryLogSchema = mongoose.Schema(
  {
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
    },
    branchOrigin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    branchDestination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    departTime: Date,
    arrivalTime: Date,
    durationMinutes: Number,
    notes: String,
  },
  { 
    _id: false,
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const activityLogSchema = mongoose.Schema(
  {
    activity: {
      type: String,
      enum: ["Berangkat", "Sampai", "Isi BBM", "Muat Barang", "Istirahat", "Other"],
    },
    description: String,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: false,
    timestamps: { createdAt: 'timestamp', updatedAt: false }
  }
);

const trackingHistorySchema = mongoose.Schema(
  {
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: [Number], // [longitude, latitude]
    },
    speed: Number,
    status: {
      type: String,
      enum: ["On Trip", "Idle", "Stopped", "Rest"],
    },
  },
  {
    _id: false,
    timestamps: { createdAt: 'timestamp', updatedAt: false }
  }
);

const truckMitraSchema = mongoose.Schema(
  {
    firstname: {
      type: String,
      required: [true, "First name is required!"],
    },
    lastname: String,
    birthdate: {
      type: Date,
      required: [true, "Birth date is required!"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: [true, "Gender is required!"],
    },
    contact: {
      noPhone: {
        type: String,
        required: [true, "Phone number is required!"],
      },
      noPhoneEmergency: {
        type: String,
        required: [true, "Emergency phone is required!"],
      },
      noPhoneContact: String,
    },
    type: {
      type: String,
      enum: ["Supir", "Kernet"],
      required: [true, "Type is required!"],
    },
    address: {
      street: String,
      city: String,
      district: String,
      province: String,
      postalCode: String,
      country: { type: String, default: "Indonesia" },
    },
    joinDate: {
      type: Date,
      required: [true, "Join date is required!"],
    },
    noKTP: {
      type: String,
      required: [true, "KTP number is required!"],
    },
    noSIM: String,
    fotoKTP: String,
    fotoIdentitas: String,
    fotoProfile: String,
    identitasKendaraan: {
      noPolisi: String,
      noSTNK: String,
      jenisKendaraan: String,
      modelKendaraan: String,
    },
    deliveryStats: {
      totalDeliveries: { type: Number, default: 0 },
      averageDuration: { type: Number, default: 0 },
      totalDistance: { type: Number, default: 0 },
      lastDeliveredAt: Date,
    },
    deliveryLogs: [deliveryLogSchema],
    activityLogs: [activityLogSchema],
    trackingHistory: [trackingHistorySchema],
    status: {
      type: String,
      enum: ["Active", "Inactive", "Blacklisted", "Suspended"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Index for location tracking
truckMitraSchema.index({ "trackingHistory.location": "2dsphere" });

module.exports = truckMitraSchema;