import mongoose from "mongoose"

const healthDataSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    heartRate: [
      {
        value: Number, // bpm
        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bloodPressure: [
      {
        systolic: Number,
        diastolic: Number,
        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    bloodOxygen: [
      {
        value: Number, // percentage
        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    temperature: [
      {
        value: Number, // celsius
        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    sleep: [
      {
        duration: Number, // in hours
        quality: Number, // 1-10
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    hydration: [
      {
        percentage: Number,
        time: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    steps: [
      {
        count: Number,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

const HealthData = mongoose.model("HealthData", healthDataSchema)

export default HealthData
