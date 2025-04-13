// This file contains functions to generate AI-powered health insights
// In a production environment, this would likely connect to an actual AI service

/**
 * Generate health insights based on patient data
 * @param {Object} healthData - Patient health data
 * @returns {Object} AI-generated insights
 */
export const generateHealthInsights = (healthData) => {
  const insights = {
    summary: "",
    recommendations: [],
    riskFactors: [],
    trends: [],
  }

  // Generate summary
  insights.summary = generateSummary(healthData)

  // Generate recommendations
  insights.recommendations = generateRecommendations(healthData)

  // Identify risk factors
  insights.riskFactors = identifyRiskFactors(healthData)

  // Analyze trends
  insights.trends = analyzeTrends(healthData)

  return insights
}

/**
 * Generate a summary of the patient's health status
 * @param {Object} healthData - Patient health data
 * @returns {String} Health summary
 */
const generateSummary = (healthData) => {
  // In a real implementation, this would use AI to generate a personalized summary
  // For now, we'll use a template-based approach

  let summary = "Based on your recent health data, "

  // Heart rate analysis
  if (healthData.heartRate && healthData.heartRate.length > 0) {
    const latestHeartRate = healthData.heartRate[healthData.heartRate.length - 1].value

    if (latestHeartRate > 100) {
      summary += "your heart rate is elevated. "
    } else if (latestHeartRate < 60) {
      summary += "your heart rate is lower than normal. "
    } else {
      summary += "your heart rate is within normal range. "
    }
  }

  // Blood pressure analysis
  if (healthData.bloodPressure && healthData.bloodPressure.length > 0) {
    const latestBP = healthData.bloodPressure[healthData.bloodPressure.length - 1]

    if (latestBP.systolic > 140 || latestBP.diastolic > 90) {
      summary += "Your blood pressure is higher than the recommended range. "
    } else if (latestBP.systolic < 90 || latestBP.diastolic < 60) {
      summary += "Your blood pressure is lower than the recommended range. "
    } else {
      summary += "Your blood pressure is within the healthy range. "
    }
  }

  // Sleep analysis
  if (healthData.sleep && healthData.sleep.length > 0) {
    const latestSleep = healthData.sleep[healthData.sleep.length - 1]

    if (latestSleep.duration < 7) {
      summary += "You're not getting enough sleep, which can affect your overall health. "
    } else if (latestSleep.duration > 9) {
      summary += "You're getting more sleep than average, which is generally good. "
    } else {
      summary += "Your sleep duration is optimal for good health. "
    }

    if (latestSleep.quality < 5) {
      summary += "However, your sleep quality could be improved. "
    } else {
      summary += "Your sleep quality is good. "
    }
  }

  // Hydration analysis
  if (healthData.hydration && healthData.hydration.length > 0) {
    const latestHydration = healthData.hydration[healthData.hydration.length - 1].percentage

    if (latestHydration < 70) {
      summary += "Your hydration levels are below optimal, consider increasing your water intake. "
    } else {
      summary += "You're maintaining good hydration levels. "
    }
  }

  return summary
}

/**
 * Generate personalized health recommendations
 * @param {Object} healthData - Patient health data
 * @returns {Array} List of recommendations
 */
const generateRecommendations = (healthData) => {
  const recommendations = []

  // Heart rate recommendations
  if (healthData.heartRate && healthData.heartRate.length > 0) {
    const latestHeartRate = healthData.heartRate[healthData.heartRate.length - 1].value

    if (latestHeartRate > 100) {
      recommendations.push({
        category: "heart-rate",
        title: "Reduce Stress",
        description: "Try deep breathing exercises or meditation to help lower your heart rate.",
        priority: "medium",
      })
    } else if (latestHeartRate < 60) {
      recommendations.push({
        category: "heart-rate",
        title: "Consult Your Doctor",
        description: "Low heart rate may be normal for you, but it's worth discussing with your doctor.",
        priority: "medium",
      })
    }
  }

  // Blood pressure recommendations
  if (healthData.bloodPressure && healthData.bloodPressure.length > 0) {
    const latestBP = healthData.bloodPressure[healthData.bloodPressure.length - 1]

    if (latestBP.systolic > 140 || latestBP.diastolic > 90) {
      recommendations.push({
        category: "blood-pressure",
        title: "Reduce Sodium Intake",
        description: "Try to limit salt in your diet to help lower your blood pressure.",
        priority: "high",
      })

      recommendations.push({
        category: "blood-pressure",
        title: "Regular Exercise",
        description: "Aim for at least 30 minutes of moderate exercise most days of the week.",
        priority: "medium",
      })
    }
  }

  // Sleep recommendations
  if (healthData.sleep && healthData.sleep.length > 0) {
    const latestSleep = healthData.sleep[healthData.sleep.length - 1]

    if (latestSleep.duration < 7) {
      recommendations.push({
        category: "sleep",
        title: "Improve Sleep Duration",
        description: "Aim for 7-9 hours of sleep per night. Try to maintain a consistent sleep schedule.",
        priority: "high",
      })
    }

    if (latestSleep.quality < 5) {
      recommendations.push({
        category: "sleep",
        title: "Improve Sleep Quality",
        description: "Create a relaxing bedtime routine and ensure your sleeping environment is comfortable.",
        priority: "medium",
      })
    }
  }

  // Hydration recommendations
  if (healthData.hydration && healthData.hydration.length > 0) {
    const latestHydration = healthData.hydration[healthData.hydration.length - 1].percentage

    if (latestHydration < 70) {
      recommendations.push({
        category: "hydration",
        title: "Increase Water Intake",
        description: "Try to drink at least 8 glasses of water throughout the day.",
        priority: "medium",
      })
    }
  }

  // General recommendations
  recommendations.push({
    category: "general",
    title: "Regular Check-ups",
    description: "Continue monitoring your health metrics and schedule regular check-ups with your doctor.",
    priority: "low",
  })

  return recommendations
}

/**
 * Identify potential risk factors based on health data
 * @param {Object} healthData - Patient health data
 * @returns {Array} List of risk factors
 */
const identifyRiskFactors = (healthData) => {
  const riskFactors = []

  // Heart rate risk factors
  if (healthData.heartRate && healthData.heartRate.length > 0) {
    const latestHeartRate = healthData.heartRate[healthData.heartRate.length - 1].value

    if (latestHeartRate > 120) {
      riskFactors.push({
        category: "heart-rate",
        title: "Elevated Heart Rate",
        description: "Consistently high heart rate may indicate stress or other cardiovascular issues.",
        severity: "high",
      })
    } else if (latestHeartRate > 100) {
      riskFactors.push({
        category: "heart-rate",
        title: "Slightly Elevated Heart Rate",
        description: "Heart rate is above normal range, which may be due to temporary factors.",
        severity: "medium",
      })
    }
  }

  // Blood pressure risk factors
  if (healthData.bloodPressure && healthData.bloodPressure.length > 0) {
    const latestBP = healthData.bloodPressure[healthData.bloodPressure.length - 1]

    if (latestBP.systolic > 180 || latestBP.diastolic > 120) {
      riskFactors.push({
        category: "blood-pressure",
        title: "Hypertensive Crisis",
        description: "Blood pressure is at a critically high level requiring immediate medical attention.",
        severity: "critical",
      })
    } else if (latestBP.systolic > 140 || latestBP.diastolic > 90) {
      riskFactors.push({
        category: "blood-pressure",
        title: "Hypertension",
        description: "Blood pressure is higher than normal, which increases risk of heart disease and stroke.",
        severity: "high",
      })
    }
  }

  // Sleep risk factors
  if (healthData.sleep && healthData.sleep.length > 0) {
    const latestSleep = healthData.sleep[healthData.sleep.length - 1]

    if (latestSleep.duration < 6) {
      riskFactors.push({
        category: "sleep",
        title: "Sleep Deprivation",
        description: "Chronic sleep deprivation can lead to various health issues including weakened immunity.",
        severity: "medium",
      })
    }
  }

  // Blood oxygen risk factors
  if (healthData.bloodOxygen && healthData.bloodOxygen.length > 0) {
    const latestO2 = healthData.bloodOxygen[healthData.bloodOxygen.length - 1].value

    if (latestO2 < 90) {
      riskFactors.push({
        category: "blood-oxygen",
        title: "Low Blood Oxygen",
        description: "Blood oxygen levels below 90% may indicate respiratory issues requiring medical attention.",
        severity: "high",
      })
    } else if (latestO2 < 95) {
      riskFactors.push({
        category: "blood-oxygen",
        title: "Slightly Low Blood Oxygen",
        description: "Blood oxygen levels are slightly below normal range.",
        severity: "medium",
      })
    }
  }

  return riskFactors
}

/**
 * Analyze trends in health data
 * @param {Object} healthData - Patient health data over time
 * @returns {Array} List of identified trends
 */
const analyzeTrends = (healthData) => {
  const trends = []

  // This is a simplified version. In a real implementation,
  // we would use more sophisticated statistical analysis

  // Heart rate trends
  if (healthData.heartRate && healthData.heartRate.length > 3) {
    const recentValues = healthData.heartRate.slice(-3).map((hr) => hr.value)
    const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length
    const increasing = recentValues[0] < recentValues[1] && recentValues[1] < recentValues[2]
    const decreasing = recentValues[0] > recentValues[1] && recentValues[1] > recentValues[2]

    if (increasing) {
      trends.push({
        category: "heart-rate",
        title: "Increasing Heart Rate",
        description: "Your heart rate has been steadily increasing over recent measurements.",
        direction: "up",
      })
    } else if (decreasing) {
      trends.push({
        category: "heart-rate",
        title: "Decreasing Heart Rate",
        description: "Your heart rate has been steadily decreasing over recent measurements.",
        direction: "down",
      })
    }
  }

  // Blood pressure trends
  if (healthData.bloodPressure && healthData.bloodPressure.length > 3) {
    const recentSystolic = healthData.bloodPressure.slice(-3).map((bp) => bp.systolic)
    const systolicIncreasing = recentSystolic[0] < recentSystolic[1] && recentSystolic[1] < recentSystolic[2]
    const systolicDecreasing = recentSystolic[0] > recentSystolic[1] && recentSystolic[1] > recentSystolic[2]

    if (systolicIncreasing) {
      trends.push({
        category: "blood-pressure",
        title: "Increasing Systolic Pressure",
        description: "Your systolic blood pressure has been steadily increasing.",
        direction: "up",
      })
    } else if (systolicDecreasing) {
      trends.push({
        category: "blood-pressure",
        title: "Decreasing Systolic Pressure",
        description: "Your systolic blood pressure has been steadily decreasing.",
        direction: "down",
      })
    }
  }

  // Sleep trends
  if (healthData.sleep && healthData.sleep.length > 3) {
    const recentDurations = healthData.sleep.slice(-3).map((s) => s.duration)
    const durationIncreasing = recentDurations[0] < recentDurations[1] && recentDurations[1] < recentDurations[2]
    const durationDecreasing = recentDurations[0] > recentDurations[1] && recentDurations[1] > recentDurations[2]

    if (durationIncreasing) {
      trends.push({
        category: "sleep",
        title: "Improving Sleep Duration",
        description: "Your sleep duration has been steadily increasing.",
        direction: "up",
      })
    } else if (durationDecreasing) {
      trends.push({
        category: "sleep",
        title: "Decreasing Sleep Duration",
        description: "Your sleep duration has been steadily decreasing.",
        direction: "down",
      })
    }
  }

  return trends
}
