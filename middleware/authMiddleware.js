import jwt from "jsonwebtoken"
import asyncHandler from "express-async-handler"
import User from "../models/User.js"

// Protect routes - verify token
export const protect = asyncHandler(async (req, res, next) => {
  let token

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Get user from the token
      req.user = await User.findById(decoded.id).select("-password")

      next()
    } catch (error) {
      console.error(error)
      res.status(401)
      throw new Error("Not authorized, token failed")
    }
  }

  if (!token) {
    res.status(401)
    throw new Error("Not authorized, no token")
  }
})

// Admin only middleware
export const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    res.status(403)
    throw new Error("Not authorized as an admin")
  }
})

// Doctor only middleware
export const doctor = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "doctor") {
    next()
  } else {
    res.status(403)
    throw new Error("Not authorized as a doctor")
  }
})

// Patient only middleware
export const patient = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "patient") {
    next()
  } else {
    res.status(403)
    throw new Error("Not authorized as a patient")
  }
})

// Doctor or admin middleware
export const doctorOrAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === "doctor" || req.user.role === "admin")) {
    next()
  } else {
    res.status(403)
    throw new Error("Not authorized")
  }
})
