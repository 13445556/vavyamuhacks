document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".auth-tab")
  const tabContents = document.querySelectorAll(".auth-tab-content")

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab")

      // active class hatao
      tabs.forEach((t) => t.classList.remove("active"))
      tabContents.forEach((content) => content.classList.remove("active"))

      // active class add kro
      tab.classList.add("active")
      document.getElementById(`${tabId}-content`).classList.add("active")
    })
  })

  const loginForm = document.getElementById("login-form")
  const registerForm = document.getElementById("register-form")

  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault()

      const email = document.getElementById("email").value
      const password = document.getElementById("password").value

      const submitBtn = this.querySelector('button[type="submit"]')
      submitBtn.textContent = "Logging in..."
      submitBtn.disabled = true

      setTimeout(() => {
        if (window.location.href.includes("auth-doctor")) {
          window.location.href = "dashboard-doctor.html"
        } else {
          window.location.href = "dashboard-patient.html"
        }
      }, 1500)
    })
  }

  if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
      e.preventDefault()

      const submitBtn = this.querySelector('button[type="submit"]')
      submitBtn.textContent = "Creating account..."
      submitBtn.disabled = true

      setTimeout(() => {
        if (window.location.href.includes("auth-doctor")) {
          window.location.href = "dashboard-doctor.html"
        } else {
          window.location.href = "dashboard-patient.html"
        }
      }, 1500)
    })
  }
})
