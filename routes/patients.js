import express from "express"
import {
  getPatients,
  getPatientById,
  getPatientHealthData,
  getPatientAppointments,
  getPatientAlerts,
  updatePatient,
  addHealthData,
} from "../controllers/patientController.js"
import { protect, doctorOrAdmin } from "../middleware/authMiddleware.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// Routes accessible by doctors and admins
router.get("/", doctorOrAdmin, getPatients)

// Routes accessible by all authenticated users
router.route("/:id").get(getPatientById).put(updatePatient)

router.get("/:id/health-data", getPatientHealthData)
router.get("/:id/appointments", getPatientAppointments)
router.get("/:id/alerts", getPatientAlerts)
router.post("/:id/health-data", addHealthData)

export default router
