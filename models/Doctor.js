import mongoose from "mongoose"

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    experience: {
      type: Number, // in years
      default: 0,
    },
    qualifications: [
      {
        degree: String,
        institution: String,
        year: Number,
      },
    ],
    workingHours: {
      start: String,
      end: String,
      daysAvailable: [String], // e.g., ['Monday', 'Tuesday', ...]
    },
    patients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
      },
    ],
    ratings: [
      {
        patient: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Patient",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
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

// Calculate average rating before saving
doctorSchema.pre("save", function (next) {
  if (this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, item) => sum + item.rating, 0)
    this.averageRating = totalRating / this.ratings.length
  }
  next()
})

const Doctor = mongoose.model("Doctor", doctorSchema)

export default Doctor
