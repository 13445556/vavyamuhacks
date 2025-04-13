import asyncHandler from "express-async-handler"
import Patient from "../models/Patient.js"
import HealthData from "../models/HealthData.js"
import Appointment from "../models/Appointment.js"
import Alert from "../models/Alert.js"

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private/Doctor
export const getPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find({})
    .populate({
      path: "user",
      select: "name email phone gender profilePicture",
    })
    .populate("assignedDoctor")

  res.json(patients)
})

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .populate({
      path: "user",
      select: "name email phone gender profilePicture",
    })
    .populate("assignedDoctor")

  if (patient) {
    res.json(patient)
  } else {
    res.status(404)
    throw new Error("Patient not found")
  }
})

// @desc    Get patient's health data
// @route   GET /api/patients/:id/health-data
// @access  Private
export const getPatientHealthData = asyncHandler(async (req, res) => {
  const healthData = await HealthData.findOne({ patient: req.params.id }).sort("-createdAt")

  if (healthData) {
    res.json(healthData)
  } else {
    res.status(404)
    throw new Error("Health data not found")
  }
})

// @desc    Get patient's appointments
// @route   GET /api/patients/:id/appointments
// @access  Private
export const getPatientAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ patient: req.params.id })
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

// @desc    Get patient's alerts
// @route   GET /api/patients/:id/alerts
// @access  Private
export const getPatientAlerts = asyncHandler(async (req, res) => {
  const alerts = await Alert.find({ patient: req.params.id })
    .populate({
      path: "doctor",
      populate: {
        path: "user",
        select: "name",
      },
    })
    .sort("-createdAt")

  res.json(alerts)
})

// @desc    Update patient profile
// @route   PUT /api/patients/:id
// @access  Private
export const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)

  if (patient) {
    patient.age = req.body.age || patient.age
    patient.height = req.body.height || patient.height
    patient.weight = req.body.weight || patient.weight
    patient.bloodType = req.body.bloodType || patient.bloodType

    if (req.body.medicalHistory) {
      patient.medicalHistory = req.body.medicalHistory
    }

    if (req.body.allergies) {
      patient.allergies = req.body.allergies
    }

    if (req.body.emergencyContact) {
      patient.emergencyContact = req.body.emergencyContact
    }

    if (req.body.assignedDoctor) {
      patient.assignedDoctor = req.body.assignedDoctor
    }

    const updatedPatient = await patient.save()
    res.json(updatedPatient)
  } else {
    res.status(404)
    throw new Error("Patient not found")
  }
})

// @desc    Add health data for patient
// @route   POST /api/patients/:id/health-data
// @access  Private
export const addHealthData = asyncHandler(async (req, res) => {
  const { heartRate, bloodPressure, bloodOxygen, temperature, sleep, hydration, steps } = req.body

  // Find existing health data for today or create new
  let healthData = await HealthData.findOne({
    patient: req.params.id,
    date: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999)),
    },
  })

  if (!healthData) {
    healthData = new HealthData({
      patient: req.params.id,
      date: new Date(),
      heartRate: [],
      bloodPressure: [],
      bloodOxygen: [],
      temperature: [],
      sleep: [],
      hydration: [],
      steps: [],
    })
  }

  // Add new data points
  if (heartRate) {
    healthData.heartRate.push({
      value: heartRate,
      time: new Date(),
    })
  }

  if (bloodPressure && bloodPressure.systolic && bloodPressure.diastolic) {
    healthData.bloodPressure.push({
      systolic: bloodPressure.systolic,
      diastolic: bloodPressure.diastolic,
      time: new Date(),
    })
  }

  if (bloodOxygen) {
    healthData.bloodOxygen.push({
      value: bloodOxygen,
      time: new Date(),
    })
  }

  if (temperature) {
    healthData.temperature.push({
      value: temperature,
      time: new Date(),
    })
  }

  if (sleep && sleep.duration && sleep.quality) {
    healthData.sleep.push({
      duration: sleep.duration,
      quality: sleep.quality,
      date: new Date(),
    })
  }

  if (hydration) {
    healthData.hydration.push({
      percentage: hydration,
      time: new Date(),
    })
  }

  if (steps) {
    healthData.steps.push({
      count: steps,
      date: new Date(),
    })
  }

  const updatedHealthData = await healthData.save()

  // Check for critical values and create alerts if necessary
  await checkForHealthAlerts(updatedHealthData)

  res.status(201).json(updatedHealthData)
})

// Helper function to check for health alerts
const checkForHealthAlerts = async (healthData) => {
  const patient = await Patient.findById(healthData.patient)

  if (!patient || !patient.assignedDoctor) {
    return
  }

  // Check heart rate
  const latestHeartRate = healthData.heartRate[healthData.heartRate.length - 1]
  if (latestHeartRate && (latestHeartRate.value > 100 || latestHeartRate.value < 60)) {
    await Alert.create({
      patient: patient._id,
      doctor: patient.assignedDoctor,
      type: latestHeartRate.value > 120 || latestHeartRate.value < 50 ? "critical" : "warning",
      title: "Abnormal Heart Rate",
      description: `Patient's heart rate is ${latestHeartRate.value} bpm, which is outside the normal range.`,
      metric: "heart-rate",
      value: `${latestHeartRate.value} bpm`,
    })
  }

  // Check blood pressure
  const latestBP = healthData.bloodPressure[healthData.bloodPressure.length - 1]
  if (
    latestBP &&
    (latestBP.systolic > 140 || latestBP.systolic < 90 || latestBP.diastolic > 90 || latestBP.diastolic < 60)
  ) {
    await Alert.create({
      patient: patient._id,
      doctor: patient.assignedDoctor,
      type:
        latestBP.systolic > 180 || latestBP.systolic < 80 || latestBP.diastolic > 120 || latestBP.diastolic < 50
          ? "critical"
          : "warning",
      title: "Abnormal Blood Pressure",
      description: `Patient's blood pressure is ${latestBP.systolic}/${latestBP.diastolic}, which is outside the normal range.`,
      metric: "blood-pressure",
      value: `${latestBP.systolic}/${latestBP.diastolic}`,
    })
  }

  // Check blood oxygen
  const latestO2 = healthData.bloodOxygen[healthData.bloodOxygen.length - 1]
  if (latestO2 && latestO2.value < 95) {
    await Alert.create({
      patient: patient._id,
      doctor: patient.assignedDoctor,
      type: latestO2.value < 90 ? "critical" : "warning",
      title: "Low Blood Oxygen",
      description: `Patient's blood oxygen is ${latestO2.value}%, which is below the normal range.`,
      metric: "blood-oxygen",
      value: `${latestO2.value}%`,
    })
  }

  // Check temperature
  const latestTemp = healthData.temperature[healthData.temperature.length - 1]
  if (latestTemp && (latestTemp.value > 37.8 || latestTemp.value < 36)) {
    await Alert.create({
      patient: patient._id,
      doctor: patient.assignedDoctor,
      type: latestTemp.value > 39 || latestTemp.value < 35 ? "critical" : "warning",
      title: "Abnormal Body Temperature",
      description: `Patient's body temperature is ${latestTemp.value}°C, which is outside the normal range.`,
      metric: "temperature",
      value: `${latestTemp.value}°C`,
    })
  }
}
