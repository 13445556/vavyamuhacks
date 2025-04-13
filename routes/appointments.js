import express from "express"
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  updateAppointment,
  deleteAppointment,
  getAvailableSlots,
} from "../controllers/appointmentController.js"
import { protect, admin } from "../middleware/authMiddleware.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// Admin only route
router.get("/", admin, getAppointments)

// Available slots route
router.get("/slots/:doctorId", getAvailableSlots)

// Appointment CRUD routes
router.route("/").post(createAppointment)

router.route("/:id").get(getAppointmentById).put(updateAppointment).delete(deleteAppointment)

// Update appointment status
router.put("/:id/status", updateAppointmentStatus)

export default router
