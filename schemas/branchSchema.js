const mongoose = require("mongoose");

const branchSchema = mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Branch code is required!"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Branch name is required!"],
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["pusat", "cabang"],
      default: "cabang",
      required: true,
    },
    address: {
      street: { type: String },
      city: { type: String },
      district: { type: String },
      province: { type: String },
      postalCode: { type: String },
      country: { type: String, default: "Indonesia" },
    },
    contact: {
      phone: { type: String },
      email: { type: String },
      fax: { type: String },
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    isActive: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
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

branchSchema.index({ location: "2dsphere" });
module.exports = branchSchema;
