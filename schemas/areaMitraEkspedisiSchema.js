const mongoose = require("mongoose");

const areaMitraEkspedisiSchema = mongoose.Schema(
  {
    ekspedisiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ListMitraEkspedisi",
      required: [true, "Ekspedisi is required!"],
    },
    province: {
      type: String,
      required: [true, "Province is required!"],
    },
    city: {
      type: String,
      required: [true, "City is required!"],
    },
    district: String,
    subDistrict: String,
    postalCode: String,
    status: {
      type: String,
      enum: ["Active", "Inactive"],
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

// Compound index for unique areas per ekspedisi
areaMitraEkspedisiSchema.index(
  { ekspedisiId: 1, province: 1, city: 1, district: 1 },
  { unique: true }
);

module.exports = areaMitraEkspedisiSchema;
