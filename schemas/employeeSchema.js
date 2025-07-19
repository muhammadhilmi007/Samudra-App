const mongoose = require("mongoose");

const documentSchema = mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Document type is required!"],
      enum: ["KTP", "SIM", "NPWP", "BPJS", "Other"],
    },
    number: {
      type: String,
      required: [true, "Document number is required!"],
    },
    issuedDate: Date,
    expiryDate: Date,
    fileUrl: String,
  },
  { _id: false }
);

const employmentHistorySchema = mongoose.Schema(
  {
    position: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
    },
    startDate: Date,
    endDate: Date,
    reason: String, // Reason for change
  },
  { _id: false }
);

const trainingRecordSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    provider: String,
    date: Date,
    duration: String, // e.g., "2 days", "8 hours"
    certificateUrl: String,
  },
  { _id: false }
);

const logSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "created",
        "updated",
        "promoted",
        "mutated",
        "resigned",
        "terminated",
      ],
    },
    date: { type: Date, default: Date.now },
    description: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: [true, "Employee code is required!"],
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: [true, "Username is required!"],
    },
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
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed"],
      default: "Single",
    },
    address: {
      street: String,
      city: String,
      district: String,
      province: String,
      postalCode: String,
      country: { type: String, default: "Indonesia" },
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
      email: {
        type: String,
        required: [true, "Email is required!"],
      },
    },
    supervisor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },
    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: [true, "Position is required!"],
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    joinDate: {
      type: Date,
      required: [true, "Join date is required!"],
    },
    resignDate: Date,
    mutationDate: Date,
    noKTP: {
      type: String,
      required: [true, "KTP number is required!"],
    },
    noSIM: String,
    fotoKTP: String,
    fotoIdentitas: String,
    fotoProfile: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Resigned", "Mutated"],
      default: "Active",
    },
    documents: [documentSchema],
    employmentHistory: [employmentHistorySchema],
    trainingRecords: [trainingRecordSchema],
    logs: [logSchema],
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

// Middleware to auto-generate employee code
employeeSchema.pre("save", async function (next) {
  if (!this.employeeCode) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.employeeCode = `EMP${year}${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = employeeSchema;
