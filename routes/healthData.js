import express from "express"
import {
  getHealthData,
  getLatestHealthData,
  addHealthData,
  getHealthDataAnalytics,
} from "../controllers/healthDataController.js"
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router()

// All routes are protected
router.use(protect)

// Health data routes
router.get("/:patientId", getHealthData)
router.get("/:patientId/latest", getLatestHealthData)
router.post("/:patientId", addHealthData)
router.get("/:patientId/analytics", getHealthDataAnalytics)

export default router
