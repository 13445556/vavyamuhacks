import User from "../models/User.js"
import Patient from "../models/Patient.js"
import Doctor from "../models/Doctor.js"
import jwt from "jsonwebtoken"
import asyncHandler from "express-async-handler"

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  })
}

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, gender, age, licenseNumber, specialization } = req.body

  // Check if user already exists
  const userExists = await User.findOne({ email })
  if (userExists) {
    res.status(400)
    throw new Error("User already exists")
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    gender,
  })

  if (user) {
    // Create patient or doctor profile based on role
    if (role === "patient" && age) {
      await Patient.create({
        user: user._id,
        age,
      })
    } else if (role === "doctor" && licenseNumber && specialization) {
      await Doctor.create({
        user: user._id,
        licenseNumber,
        specialization,
      })
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    })
  } else {
    res.status(400)
    throw new Error("Invalid user data")
  }
})

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Check for user email
  const user = await User.findOne({ email })

  if (user && (await user.matchPassword(password))) {
    let profileData = null

    // Get additional profile data based on role
    if (user.role === "patient") {
      profileData = await Patient.findOne({ user: user._id })
    } else if (user.role === "doctor") {
      profileData = await Doctor.findOne({ user: user._id })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileData,
      token: generateToken(user._id),
    })
  } else {
    res.status(401)
    throw new Error("Invalid email or password")
  }
})

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password")

  if (user) {
    let profileData = null

    // Get additional profile data based on role
    if (user.role === "patient") {
      profileData = await Patient.findOne({ user: user._id })
    } else if (user.role === "doctor") {
      profileData = await Doctor.findOne({ user: user._id })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      gender: user.gender,
      profilePicture: user.profilePicture,
      profileData,
    })
  } else {
    res.status(404)
    throw new Error("User not found")
  }
})

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    user.name = req.body.name || user.name
    user.email = req.body.email || user.email
    user.phone = req.body.phone || user.phone
    user.gender = req.body.gender || user.gender
    user.profilePicture = req.body.profilePicture || user.profilePicture

    if (req.body.password) {
      user.password = req.body.password
    }

    const updatedUser = await user.save()

    // Update profile data based on role
    if (user.role === "patient" && req.body.patientData) {
      const patient = await Patient.findOne({ user: user._id })
      if (patient) {
        patient.age = req.body.patientData.age || patient.age
        patient.height = req.body.patientData.height || patient.height
        patient.weight = req.body.patientData.weight || patient.weight
        patient.bloodType = req.body.patientData.bloodType || patient.bloodType

        if (req.body.patientData.medicalHistory) {
          patient.medicalHistory = req.body.patientData.medicalHistory
        }

        if (req.body.patientData.allergies) {
          patient.allergies = req.body.patientData.allergies
        }

        if (req.body.patientData.emergencyContact) {
          patient.emergencyContact = req.body.patientData.emergencyContact
        }

        await patient.save()
      }
    } else if (user.role === "doctor" && req.body.doctorData) {
      const doctor = await Doctor.findOne({ user: user._id })
      if (doctor) {
        doctor.specialization = req.body.doctorData.specialization || doctor.specialization
        doctor.experience = req.body.doctorData.experience || doctor.experience

        if (req.body.doctorData.qualifications) {
          doctor.qualifications = req.body.doctorData.qualifications
        }

        if (req.body.doctorData.workingHours) {
          doctor.workingHours = req.body.doctorData.workingHours
        }

        await doctor.save()
      }
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    })
  } else {
    res.status(404)
    throw new Error("User not found")
  }
})
