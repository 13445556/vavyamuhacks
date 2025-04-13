import asyncHandler from "express-async-handler"
import HealthData from "../models/HealthData.js"
import Patient from "../models/Patient.js"
import Alert from "../models/Alert.js"

// @desc    Get health data by patient ID
// @route   GET /api/health-data/:patientId
// @access  Private
export const getHealthData = asyncHandler(async (req, res) => {
  const healthData = await HealthData.find({ patient: req.params.patientId }).sort("-date").limit(7) // Get last 7 days of data

  if (healthData && healthData.length > 0) {
    res.json(healthData)
  } else {
    res.status(404)
    throw new Error("Health data not found")
  }
})

// @desc    Get latest health data by patient ID
// @route   GET /api/health-data/:patientId/latest
// @access  Private
export const getLatestHealthData = asyncHandler(async (req, res) => {
  const healthData = await HealthData.findOne({ patient: req.params.patientId }).sort("-date")

  if (healthData) {
    res.json(healthData)
  } else {
    res.status(404)
    throw new Error("Health data not found")
  }
})

// @desc    Add health data for patient
// @route   POST /api/health-data/:patientId
// @access  Private
export const addHealthData = asyncHandler(async (req, res) => {
  const { heartRate, bloodPressure, bloodOxygen, temperature, sleep, hydration, steps } = req.body

  // Validate patient
  const patient = await Patient.findById(req.params.patientId)

  if (!patient) {
    res.status(404)
    throw new Error("Patient not found")
  }

  // Find existing health data for today or create new
  let healthData = await HealthData.findOne({
    patient: req.params.patientId,
    date: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999)),
    },
  })

  if (!healthData) {
    healthData = new HealthData({
      patient: req.params.patientId,
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

// @desc    Get health data analytics
// @route   GET /api/health-data/:patientId/analytics
// @access  Private
export const getHealthDataAnalytics = asyncHandler(async (req, res) => {
  // Get last 30 days of data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const healthData = await HealthData.find({
    patient: req.params.patientId,
    date: { $gte: thirtyDaysAgo },
  }).sort("date")

  if (!healthData || healthData.length === 0) {
    res.status(404)
    throw new Error("No health data found for analysis")
  }

  // Process data for analytics
  const analytics = {
    heartRate: processHeartRateData(healthData),
    bloodPressure: processBloodPressureData(healthData),
    sleep: processSleepData(healthData),
    hydration: processHydrationData(healthData),
    steps: processStepsData(healthData),
  }

  res.json(analytics)
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

// Helper functions for analytics
const processHeartRateData = (healthData) => {
  const dailyAverages = []
  const allValues = []

  healthData.forEach((day) => {
    if (day.heartRate && day.heartRate.length > 0) {
      const dayValues = day.heartRate.map((hr) => hr.value)
      const avg = dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length

      dailyAverages.push({
        date: day.date.toISOString().split("T")[0],
        value: Math.round(avg),
      })

      allValues.push(...dayValues)
    }
  })

  return {
    dailyAverages,
    overall: {
      min: Math.min(...allValues),
      max: Math.max(...allValues),
      avg: Math.round(allValues.reduce((sum, val) => sum + val, 0) / allValues.length),
    },
  }
}

const processBloodPressureData = (healthData) => {
  const dailyAverages = []
  const allSystolic = []
  const allDiastolic = []

  healthData.forEach((day) => {
    if (day.bloodPressure && day.bloodPressure.length > 0) {
      const systolicValues = day.bloodPressure.map((bp) => bp.systolic)
      const diastolicValues = day.bloodPressure.map((bp) => bp.diastolic)

      const avgSystolic = systolicValues.reduce((sum, val) => sum + val, 0) / systolicValues.length
      const avgDiastolic = diastolicValues.reduce((sum, val) => sum + val, 0) / diastolicValues.length

      dailyAverages.push({
        date: day.date.toISOString().split("T")[0],
        systolic: Math.round(avgSystolic),
        diastolic: Math.round(avgDiastolic),
      })

      allSystolic.push(...systolicValues)
      allDiastolic.push(...diastolicValues)
    }
  })

  return {
    dailyAverages,
    overall: {
      systolic: {
        min: Math.min(...allSystolic),
        max: Math.max(...allSystolic),
        avg: Math.round(allSystolic.reduce((sum, val) => sum + val, 0) / allSystolic.length),
      },
      diastolic: {
        min: Math.min(...allDiastolic),
        max: Math.max(...allDiastolic),
        avg: Math.round(allDiastolic.reduce((sum, val) => sum + val, 0) / allDiastolic.length),
      },
    },
  }
}

const processSleepData = (healthData) => {
  const dailyValues = []
  const allDurations = []
  const allQualities = []

  healthData.forEach((day) => {
    if (day.sleep && day.sleep.length > 0) {
      // Usually there's only one sleep entry per day
      const sleepEntry = day.sleep[0]

      dailyValues.push({
        date: day.date.toISOString().split("T")[0],
        duration: sleepEntry.duration,
        quality: sleepEntry.quality,
      })

      allDurations.push(sleepEntry.duration)
      allQualities.push(sleepEntry.quality)
    }
  })

  return {
    dailyValues,
    overall: {
      duration: {
        min: Math.min(...allDurations),
        max: Math.max(...allDurations),
        avg: (allDurations.reduce((sum, val) => sum + val, 0) / allDurations.length).toFixed(1),
      },
      quality: {
        min: Math.min(...allQualities),
        max: Math.max(...allQualities),
        avg: (allQualities.reduce((sum, val) => sum + val, 0) / allQualities.length).toFixed(1),
      },
    },
  }
}

const processHydrationData = (healthData) => {
  const dailyAverages = []
  const allValues = []

  healthData.forEach((day) => {
    if (day.hydration && day.hydration.length > 0) {
      const dayValues = day.hydration.map((h) => h.percentage)
      const avg = dayValues.reduce((sum, val) => sum + val, 0) / dayValues.length

      dailyAverages.push({
        date: day.date.toISOString().split("T")[0],
        value: Math.round(avg),
      })

      allValues.push(...dayValues)
    }
  })

  return {
    dailyAverages,
    overall: {
      min: Math.min(...allValues),
      max: Math.max(...allValues),
      avg: Math.round(allValues.reduce((sum, val) => sum + val, 0) / allValues.length),
    },
  }
}

const processStepsData = (healthData) => {
  const dailyValues = []
  const allValues = []

  healthData.forEach((day) => {
    if (day.steps && day.steps.length > 0) {
      // Usually there's only one steps entry per day
      const stepsEntry = day.steps[0]

      dailyValues.push({
        date: day.date.toISOString().split("T")[0],
        count: stepsEntry.count,
      })

      allValues.push(stepsEntry.count)
    }
  })

  return {
    dailyValues,
    overall: {
      min: Math.min(...allValues),
      max: Math.max(...allValues),
      avg: Math.round(allValues.reduce((sum, val) => sum + val, 0) / allValues.length),
    },
  }
}
