const mongoose = require("mongoose");
const { isEmail } = require("validator");
const validator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name field is required !"],
    },
    email: {
      type: String,
      validate: [isEmail, "Enter a valid email address !"],
      required: [true, "Email address is required !"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Enter your desired password !"],
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    division_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      required: true,
    },
    position_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(validator, { message: "Email address already exists !" });
module.exports = userSchema;
