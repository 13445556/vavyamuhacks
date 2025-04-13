// animations class ke liye
document.addEventListener("DOMContentLoaded", () => {
  const featureCards = document.querySelectorAll(".feature-card")
  featureCards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add("animate-pulse")
    }, index * 200)
  })
  const roleCards = document.querySelectorAll(".role-card")
  roleCards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add("animate-float")
    }, index * 200)
  })
})
