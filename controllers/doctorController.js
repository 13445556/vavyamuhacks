import asyncHandler from "express-async-handler"
import Doctor from "../models/Doctor.js"
import Patient from "../models/Patient.js"
import Appointment from "../models/Appointment.js"
import Alert from "../models/Alert.js"

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
export const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({})
    .populate({
      path: "user",
      select: "name email phone gender profilePicture",
    })
    .select("-patients")

  res.json(doctors)
})

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Private
export const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate({
    path: "user",
    select: "name email phone gender profilePicture",
  })

  if (doctor) {
    res.json(doctor)
  } else {
    res.status(404)
    throw new Error("Doctor not found")
  }
})

// @desc    Get doctor's patients
// @route   GET /api/doctors/:id/patients
// @access  Private/Doctor
export const getDoctorPatients = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)

  if (!doctor) {
    res.status(404)
    throw new Error("Doctor not found")
  }

  const patients = await Patient.find({ assignedDoctor: doctor._id }).populate({
    path: "user",
    select: "name email phone gender profilePicture",
  })

  res.json(patients)
})

// @desc    Get doctor's appointments
// @route   GET /api/doctors/:id/appointments
// @access  Private/Doctor
export const getDoctorAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ doctor: req.params.id })
    .populate({
      path: "patient",
      populate: {
        path: "user",
        select: "name",
      },
    })
    .sort("-date")

  res.json(appointments)
})

// @desc    Get doctor's alerts
// @route   GET /api/doctors/:id/alerts
// @access  Private/Doctor
export const getDoctorAlerts = asyncHandler(async (req, res) => {
  const alerts = await Alert.find({ doctor: req.params.id })
    .populate({
      path: "patient",
      populate: {
        path: "user",
        select: "name",
      },
    })
    .sort("-createdAt")

  res.json(alerts)
})

// @desc    Update doctor profile
// @route   PUT /api/doctors/:id
// @access  Private/Doctor
export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)

  if (doctor) {
    doctor.specialization = req.body.specialization || doctor.specialization
    doctor.experience = req.body.experience || doctor.experience

    if (req.body.qualifications) {
      doctor.qualifications = req.body.qualifications
    }

    if (req.body.workingHours) {
      doctor.workingHours = req.body.workingHours
    }

    const updatedDoctor = await doctor.save()
    res.json(updatedDoctor)
  } else {
    res.status(404)
    throw new Error("Doctor not found")
  }
})

// @desc    Add patient to doctor
// @route   POST /api/doctors/:id/patients
// @access  Private/Doctor
export const addPatientToDoctor = asyncHandler(async (req, res) => {
  const { patientId } = req.body

  const doctor = await Doctor.findById(req.params.id)
  const patient = await Patient.findById(patientId)

  if (!doctor) {
    res.status(404)
    throw new Error("Doctor not found")
  }

  if (!patient) {
    res.status(404)
    throw new Error("Patient not found")
  }

  // Check if patient is already assigned to this doctor
  if (patient.assignedDoctor && patient.assignedDoctor.toString() === doctor._id.toString()) {
    res.status(400)
    throw new Error("Patient is already assigned to this doctor")
  }

  // Update patient's assigned doctor
  patient.assignedDoctor = doctor._id
  await patient.save()

  // Add patient to doctor's patients list if not already there
  if (!doctor.patients.includes(patientId)) {
    doctor.patients.push(patientId)
    await doctor.save()
  }

  res.status(201).json({ message: "Patient assigned to doctor successfully" })
})

// @desc    Remove patient from doctor
// @route   DELETE /api/doctors/:id/patients/:patientId
// @access  Private/Doctor
export const removePatientFromDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id)
  const patient = await Patient.findById(req.params.patientId)

  if (!doctor) {
    res.status(404)
    throw new Error("Doctor not found")
  }

  if (!patient) {
    res.status(404)
    throw new Error("Patient not found")
  }

  // Check if patient is assigned to this doctor
  if (!patient.assignedDoctor || patient.assignedDoctor.toString() !== doctor._id.toString()) {
    res.status(400)
    throw new Error("Patient is not assigned to this doctor")
  }

  // Remove doctor assignment from patient
  patient.assignedDoctor = null
  await patient.save()

  // Remove patient from doctor's patients list
  doctor.patients = doctor.patients.filter((p) => p.toString() !== req.params.patientId)
  await doctor.save()

  res.json({ message: "Patient removed from doctor successfully" })
})

// @desc    Add rating to doctor
// @route   POST /api/doctors/:id/ratings
// @access  Private/Patient
export const addDoctorRating = asyncHandler(async (req, res) => {
  const { rating, review } = req.body

  const doctor = await Doctor.findById(req.params.id)

  if (!doctor) {
    res.status(404)
    throw new Error("Doctor not found")
  }

  // Get patient ID from authenticated user
  const patient = await Patient.findOne({ user: req.user._id })

  if (!patient) {
    res.status(404)
    throw new Error("Patient not found")
  }

  // Check if patient has already rated this doctor
  const existingRating = doctor.ratings.find((r) => r.patient.toString() === patient._id.toString())

  if (existingRating) {
    // Update existing rating
    existingRating.rating = rating
    existingRating.review = review
    existingRating.date = new Date()
  } else {
    // Add new rating
    doctor.ratings.push({
      patient: patient._id,
      rating,
      review,
      date: new Date(),
    })
  }

  await doctor.save()

  res.status(201).json({ message: "Rating added successfully" })
})
