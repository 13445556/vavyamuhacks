import asyncHandler from "express-async-handler"
import Appointment from "../models/Appointment.js"
import Doctor from "../models/Doctor.js"
import Patient from "../models/Patient.js"
import { sendAppointmentEmail } from "../utils/emailService.js"

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private/Admin
export const getAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({})
    .populate({
      path: "patient",
      populate: {
        path: "user",
        select: "name",
      },
    })
    .populate({
      path: "doctor",
      populate: {
        path: "user",
        select: "name",
      },
    })
    .sort("-date")

  res.json(appointments)
})

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
export const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({
      path: "patient",
      populate: {
        path: "user",
        select: "name email",
      },
    })
    .populate({
      path: "doctor",
      populate: {
        path: "user",
        select: "name email",
      },
    })

  if (appointment) {
    res.json(appointment)
  } else {
    res.status(404)
    throw new Error("Appointment not found")
  }
})

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private
export const createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorId, date, time, duration, type, concern } = req.body

  // Validate patient and doctor
  const patient = await Patient.findById(patientId).populate("user", "email name")
  const doctor = await Doctor.findById(doctorId).populate("user", "email name")

  if (!patient) {
    res.status(404)
    throw new Error("Patient not found")
  }

  if (!doctor) {
    res.status(404)
    throw new Error("Doctor not found")
  }

  // Check if the appointment time is available
  const appointmentDate = new Date(date)
  const existingAppointment = await Appointment.findOne({
    doctor: doctorId,
    date: {
      $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
      $lt: new Date(appointmentDate.setHours(23, 59, 59, 999)),
    },
    time,
    status: { $ne: "cancelled" },
  })

  if (existingAppointment) {
    res.status(400)
    throw new Error("This appointment slot is already booked")
  }

  // Create appointment
  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    date,
    time,
    duration: duration || 30,
    type,
    concern,
    status: "scheduled",
  })

  if (appointment) {
    // Generate a meeting link (this could be integrated with a video service API)
    const meetingLink = `https://meet.healthify.com/${appointment._id}`
    appointment.meetingLink = meetingLink
    await appointment.save()

    // Send email notifications
    try {
      await sendAppointmentEmail(patient.user.email, doctor.user.email, {
        patientName: patient.user.name,
        doctorName: doctor.user.name,
        date,
        time,
        type,
        concern,
        meetingLink,
      })
    } catch (error) {
      console.error("Email notification failed:", error)
    }

    res.status(201).json(appointment)
  } else {
    res.status(400)
    throw new Error("Invalid appointment data")
  }
})

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body

  const appointment = await Appointment.findById(req.params.id)

  if (appointment) {
    appointment.status = status

    if (status === "completed") {
      appointment.notes = req.body.notes || appointment.notes
    }

    const updatedAppointment = await appointment.save()
    res.json(updatedAppointment)
  } else {
    res.status(404)
    throw new Error("Appointment not found")
  }
})

// @desc    Update appointment details
// @route   PUT /api/appointments/:id
// @access  Private
export const updateAppointment = asyncHandler(async (req, res) => {
  const { date, time, duration, type, concern, notes } = req.body

  const appointment = await Appointment.findById(req.params.id)

  if (appointment) {
    // Only allow updates if appointment is not completed or cancelled
    if (appointment.status === "completed" || appointment.status === "cancelled") {
      res.status(400)
      throw new Error("Cannot update a completed or cancelled appointment")
    }

    appointment.date = date || appointment.date
    appointment.time = time || appointment.time
    appointment.duration = duration || appointment.duration
    appointment.type = type || appointment.type
    appointment.concern = concern || appointment.concern
    appointment.notes = notes || appointment.notes

    const updatedAppointment = await appointment.save()
    res.json(updatedAppointment)
  } else {
    res.status(404)
    throw new Error("Appointment not found")
  }
})

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
export const deleteAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)

  if (appointment) {
    // Instead of deleting, mark as cancelled
    appointment.status = "cancelled"
    await appointment.save()

    res.json({ message: "Appointment cancelled" })
  } else {
    res.status(404)
    throw new Error("Appointment not found")
  }
})

// @desc    Get available appointment slots for a doctor
// @route   GET /api/appointments/slots/:doctorId
// @access  Private
export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { date } = req.query
  const doctorId = req.params.doctorId

  // Validate doctor
  const doctor = await Doctor.findById(doctorId)

  if (!doctor) {
    res.status(404)
    throw new Error("Doctor not found")
  }

  // Get doctor's working hours
  const workingHours = doctor.workingHours

  if (!workingHours || !workingHours.start || !workingHours.end) {
    res.status(400)
    throw new Error("Doctor working hours not set")
  }

  // Get the day of week for the requested date
  const requestedDate = date ? new Date(date) : new Date()
  const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
    requestedDate.getDay()
  ]

  // Check if doctor works on this day
  if (!workingHours.daysAvailable.includes(dayOfWeek)) {
    return res.json({
      available: false,
      message: `Doctor is not available on ${dayOfWeek}`,
      slots: [],
    })
  }

  // Generate time slots based on working hours (30 min intervals)
  const slots = generateTimeSlots(workingHours.start, workingHours.end, 30)

  // Get booked appointments for the requested date
  const bookedAppointments = await Appointment.find({
    doctor: doctorId,
    date: {
      $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
      $lt: new Date(requestedDate.setHours(23, 59, 59, 999)),
    },
    status: { $ne: "cancelled" },
  })

  // Filter out booked slots
  const bookedTimes = bookedAppointments.map((app) => app.time)
  const availableSlots = slots.filter((slot) => !bookedTimes.includes(slot))

  res.json({
    available: true,
    date: requestedDate.toISOString().split("T")[0],
    slots: availableSlots,
  })
})

// Helper function to generate time slots
const generateTimeSlots = (start, end, intervalMinutes) => {
  const slots = []
  const startTime = new Date(`2000-01-01T${start}`)
  const endTime = new Date(`2000-01-01T${end}`)

  let currentTime = new Date(startTime)

  while (currentTime < endTime) {
    const hours = currentTime.getHours().toString().padStart(2, "0")
    const minutes = currentTime.getMinutes().toString().padStart(2, "0")
    slots.push(`${hours}:${minutes}`)

    currentTime = new Date(currentTime.getTime() + intervalMinutes * 60000)
  }

  return slots
}
