const mongoose = require("mongoose");

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required!"],
    },
    code: {
      type: String,
      required: [true, "Product code is required!"],
      unique: true,
    },
    description: {
      type: String,
      required: false,
    },
    price: {
      type: Number,
      required: [true, "Product price is required!"],
      min: 0,
    },
    stock: {
      type: Number,
      required: [true, "Product stock is required!"],
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: [true, "Product unit is required!"],
    },
    category: {
      type: String,
      required: false,
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required!"],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = productSchema;
