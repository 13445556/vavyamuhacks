import nodemailer from "nodemailer"

// Create a test account if no email credentials are provided
let transporter

// Initialize email transporter
const initTransporter = async () => {
  // If in production, use real email credentials
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  } else {
    // For development, use ethereal.email
    const testAccount = await nodemailer.createTestAccount()

    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })

    console.log("Using test email account:", testAccount.user)
  }
}

// Initialize transporter when the app starts
initTransporter()

// Send appointment confirmation email
export const sendAppointmentEmail = async (patientEmail, doctorEmail, appointmentDetails) => {
  if (!transporter) {
    await initTransporter()
  }

  // Email to patient
  const patientMailOptions = {
    from: `"Healthify" <${process.env.EMAIL_USER || "noreply@healthify.com"}>`,
    to: patientEmail,
    subject: "Your Appointment Confirmation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #0a5f9e;">Appointment Confirmation</h2>
        <p>Dear Patient,</p>
        <p>Your appointment has been scheduled successfully.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Doctor:</strong> ${appointmentDetails.doctorName}</p>
          <p><strong>Date:</strong> ${new Date(appointmentDetails.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${appointmentDetails.time}</p>
          <p><strong>Type:</strong> ${appointmentDetails.type}</p>
          <p><strong>Concern:</strong> ${appointmentDetails.concern}</p>
        </div>
        <p>For virtual appointments, please use the following link at the scheduled time:</p>
        <p><a href="${appointmentDetails.meetingLink}" style="color: #0a5f9e;">${appointmentDetails.meetingLink}</a></p>
        <p>If you need to reschedule or cancel, please contact us at least 24 hours before your appointment.</p>
        <p>Thank you for choosing Healthify for your healthcare needs.</p>
        <p>Best regards,<br>The Healthify Team</p>
      </div>
    `,
  }

  // Email to doctor
  const doctorMailOptions = {
    from: `"Healthify" <${process.env.EMAIL_USER || "noreply@healthify.com"}>`,
    to: doctorEmail,
    subject: "New Appointment Scheduled",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #0a5f9e;">New Appointment</h2>
        <p>Dear Dr. ${appointmentDetails.doctorName},</p>
        <p>A new appointment has been scheduled with you.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Patient:</strong> ${appointmentDetails.patientName}</p>
          <p><strong>Date:</strong> ${new Date(appointmentDetails.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${appointmentDetails.time}</p>
          <p><strong>Type:</strong> ${appointmentDetails.type}</p>
          <p><strong>Concern:</strong> ${appointmentDetails.concern}</p>
        </div>
        <p>For virtual appointments, please use the following link at the scheduled time:</p>
        <p><a href="${appointmentDetails.meetingLink}" style="color: #0a5f9e;">${appointmentDetails.meetingLink}</a></p>
        <p>Thank you for your dedication to patient care.</p>
        <p>Best regards,<br>The Healthify Team</p>
      </div>
    `,
  }

  try {
    // Send emails
    const patientInfo = await transporter.sendMail(patientMailOptions)
    const doctorInfo = await transporter.sendMail(doctorMailOptions)

    // For development, log the test email URLs
    if (!process.env.EMAIL_HOST) {
      console.log("Patient email preview URL: %s", nodemailer.getTestMessageUrl(patientInfo))
      console.log("Doctor email preview URL: %s", nodemailer.getTestMessageUrl(doctorInfo))
    }

    return { patientInfo, doctorInfo }
  } catch (error) {
    console.error("Email sending failed:", error)
    throw error
  }
}

// Send alert notification email
export const sendAlertEmail = async (doctorEmail, alertDetails) => {
  if (!transporter) {
    await initTransporter()
  }

  const mailOptions = {
    from: `"Healthify Alerts" <${process.env.EMAIL_USER || "alerts@healthify.com"}>`,
    to: doctorEmail,
    subject: `${alertDetails.type === "critical" ? "CRITICAL ALERT" : "Alert"}: ${alertDetails.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: ${alertDetails.type === "critical" ? "#ef4444" : "#f59e0b"};">
          ${alertDetails.type === "critical" ? "CRITICAL ALERT" : "Alert"}: ${alertDetails.title}
        </h2>
        <p>Dear Dr. ${alertDetails.doctorName},</p>
        <p>An alert has been generated for your patient:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Patient:</strong> ${alertDetails.patientName}</p>
          <p><strong>Alert Type:</strong> ${alertDetails.type}</p>
          <p><strong>Metric:</strong> ${alertDetails.metric}</p>
          <p><strong>Value:</strong> ${alertDetails.value}</p>
          <p><strong>Description:</strong> ${alertDetails.description}</p>
          <p><strong>Time:</strong> ${new Date(alertDetails.createdAt).toLocaleString()}</p>
        </div>
        <p>Please review this alert in your dashboard and take appropriate action.</p>
        <p><a href="${alertDetails.dashboardLink}" style="display: inline-block; background-color: #0a5f9e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Dashboard</a></p>
        <p>Thank you for your prompt attention to this matter.</p>
        <p>Best regards,<br>The Healthify Team</p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)

    // For development, log the test email URL
    if (!process.env.EMAIL_HOST) {
      console.log("Alert email preview URL: %s", nodemailer.getTestMessageUrl(info))
    }

    return info
  } catch (error) {
    console.error("Alert email sending failed:", error)
    throw error
  }
}
