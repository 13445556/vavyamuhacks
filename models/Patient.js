import mongoose from "mongoose"

const patientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    height: {
      type: Number, // in cm
      default: 0,
    },
    weight: {
      type: Number, // in kg
      default: 0,
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
    },
    medicalHistory: [
      {
        condition: String,
        diagnosedDate: Date,
        notes: String,
      },
    ],
    allergies: [
      {
        type: String,
      },
    ],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
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

// Virtual for BMI calculation
patientSchema.virtual("bmi").get(function () {
  if (this.height && this.weight) {
    // BMI = weight(kg) / (height(m))²
    const heightInMeters = this.height / 100
    return (this.weight / (heightInMeters * heightInMeters)).toFixed(1)
  }
  return null
})

const Patient = mongoose.model("Patient", patientSchema)

export default Patient
