import express from "express"
import {
  getDoctors,
  getDoctorById,
  getDoctorPatients,
  getDoctorAppointments,
  getDoctorAlerts,
  updateDoctor,
  addPatientToDoctor,
  removePatientFromDoctor,
  addDoctorRating,
} from "../controllers/doctorController.js"
import { protect, doctorOrAdmin } from "../middleware/authMiddleware.js"

const router = express.Router()

// Public route to get all doctors
router.get("/", getDoctors)

// All other routes are protected
router.use(protect)

// Get doctor by ID
router.get("/:id", getDoctorById)

// Doctor-specific routes
router.put("/:id", updateDoctor)
router.get("/:id/patients", doctorOrAdmin, getDoctorPatients)
router.get("/:id/appointments", doctorOrAdmin, getDoctorAppointments)
router.get("/:id/alerts", doctorOrAdmin, getDoctorAlerts)

// Patient management routes
router.post("/:id/patients", doctorOrAdmin, addPatientToDoctor)
router.delete("/:id/patients/:patientId", doctorOrAdmin, removePatientFromDoctor)

// Rating route
router.post("/:id/ratings", addDoctorRating)

export default router
