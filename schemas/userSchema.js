const mongoose = require("mongoose");
const { isEmail } = require("validator");
const validator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required!"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters long"],
    },
    firstname: {
        type: String,
        required: [true, "First name is required!"],
        trim: true,
    },
    lastname: {
        type: String,
        required: false,
        trim: true,
    },
    email: {
      type: String,
      validate: [isEmail, "Enter a valid email address!"],
      required: [true, "Email address is required!"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
        type: String,
        required: false,
        unique: true,
        trim: true,
    },
    photoProfile: {
        type: String,
        required: false,
    },
    status: { // true = Pusat, false = Cabang
        type: Boolean,
        default: false,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: false,
      default: null,
    },
    division_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
      required: [true, "Division is required!"],
    },
    position_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: [true, "Position is required!"],
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role is required!"],
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

userSchema.plugin(validator, { message: "Error, expected {PATH} to be unique. Value: {VALUE}" });

module.exports = userSchema;
