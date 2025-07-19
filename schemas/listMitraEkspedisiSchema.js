const mongoose = require("mongoose");

const listMitraEkspedisiSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Mitra name is required!"],
      unique: true,
    },
    code: {
      type: String,
      required: [true, "Mitra code is required!"],
      unique: true,
      uppercase: true,
    },
    address: {
      type: String,
      required: [true, "Address is required!"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required!"],
    },
    email: String,
    contactPerson: {
      type: String,
      required: [true, "Contact person is required!"],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    daftarHarga: String, // Price list file URL
    description: String,
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

module.exports = listMitraEkspedisiSchema;
