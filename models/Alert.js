import mongoose from "mongoose"

const alertSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    type: {
      type: String,
      enum: ["critical", "warning", "info"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metric: {
      type: String,
      enum: ["heart-rate", "blood-pressure", "blood-oxygen", "temperature", "sleep", "other"],
      required: true,
    },
    value: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

const Alert = mongoose.model("Alert", alertSchema)

export default Alert
