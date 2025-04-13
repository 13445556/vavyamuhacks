import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      default: 30,
    },
    type: {
      type: String,
      enum: ["initial-consultation", "follow-up", "emergency", "regular-checkup"],
      default: "regular-checkup",
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled", "no-show"],
      default: "scheduled",
    },
    concern: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    meetingLink: {
      type: String,
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

const Appointment = mongoose.model("Appointment", appointmentSchema)

export default Appointment
