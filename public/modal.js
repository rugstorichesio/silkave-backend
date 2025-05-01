// Custom Modal System for Silk Ave

// Modal state
let modalActive = false
let modalCallback = null
let modalInputValue = ""

// Play sound function
function playModalSound(soundId) {
  try {
    const sound = document.getElementById(soundId)
    if (sound) {
      sound.currentTime = 0
      sound.play().catch((e) => console.log("Audio play failed:", e))
    }
  } catch (e) {
    console.error("Error playing sound:", e)
  }
}

// Create modal elements
function createModal(title, message, type, options = []) {
  // Create overlay
  const overlay = document.createElement("div")
  overlay.className = "modal-overlay"
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85) !important;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  `

  // Create container
  const container = document.createElement("div")
  container.className = "modal-container"
  container.style.cssText = `
    background-color: #111 !important;
    color: #0f0 !important;
    border: 2px solid #0f0 !important;
    box-shadow: 0 0 20px #0f0 !important;
    padding: 1.5rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  `

  // Create header
  const header = document.createElement("div")
  header.className = "modal-header"
  header.textContent = title
  header.style.cssText = `
    color: #0f0 !important; 
    text-shadow: 0 0 5px #0f0 !important;
    text-align: center;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  `

  // Create content
  const content = document.createElement("div")
  content.className = "modal-content"
  content.textContent = message
  content.style.cssText = `
    color: #0f0 !important;
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
    line-height: 1.5;
    white-space: pre-line;
  `

  // Create buttons container
  const buttons = document.createElement("div")
  buttons.className = "modal-buttons"
  buttons.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 1rem;
  `

  // Add input field for prompt type
  if (type === "prompt") {
    const input = document.createElement("input")
    input.type = "text"
    input.className = "modal-input"
    input.placeholder = "Enter your response..."
    input.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      width: 100%;
      padding: 0.5rem;
      margin-bottom: 1rem;
      font-family: monospace;
    `
    input.addEventListener("input", (e) => {
      modalInputValue = e.target.value
    })
    container.appendChild(header)
    container.appendChild(content)
    container.appendChild(input)

    // Focus the input after a short delay
    setTimeout(() => input.focus(), 100)
  } else {
    container.appendChild(header)
    container.appendChild(content)
  }

  // Add buttons based on type
  if (type === "alert") {
    const okButton = document.createElement("button")
    okButton.className = "modal-button"
    okButton.textContent = "OK"
    okButton.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      padding: 0.5rem 1.5rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    `
    okButton.addEventListener("click", () => {
      closeModal()
      if (modalCallback) modalCallback(true)
    })
    buttons.appendChild(okButton)
  } else if (type === "confirm") {
    // Add OK button
    const okButton = document.createElement("button")
    okButton.className = "modal-button"
    okButton.textContent = options[0] || "OK"
    okButton.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      padding: 0.5rem 1.5rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    `
    okButton.addEventListener("click", () => {
      closeModal()
      if (modalCallback) modalCallback(true)
    })

    // Add Cancel button
    const cancelButton = document.createElement("button")
    cancelButton.className = "modal-button"
    cancelButton.textContent = options[1] || "Cancel"
    cancelButton.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      padding: 0.5rem 1.5rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    `
    cancelButton.addEventListener("click", () => {
      closeModal()
      if (modalCallback) modalCallback(false)
    })

    buttons.appendChild(okButton)
    buttons.appendChild(cancelButton)
  } else if (type === "prompt") {
    // Add OK button
    const okButton = document.createElement("button")
    okButton.className = "modal-button"
    okButton.textContent = "OK"
    okButton.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      padding: 0.5rem 1.5rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    `
    okButton.addEventListener("click", () => {
      closeModal()
      if (modalCallback) modalCallback(modalInputValue)
    })

    // Add Cancel button
    const cancelButton = document.createElement("button")
    cancelButton.className = "modal-button"
    cancelButton.textContent = "Cancel"
    cancelButton.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      padding: 0.5rem 1.5rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    `
    cancelButton.addEventListener("click", () => {
      closeModal()
      if (modalCallback) modalCallback(null)
    })

    buttons.appendChild(okButton)
    buttons.appendChild(cancelButton)
  }

  container.appendChild(buttons)
  overlay.appendChild(container)

  // Add to document
  document.body.appendChild(overlay)

  // Play sound
  try {
    playModalSound("bleep")
  } catch (e) {
    console.log("Sound play failed:", e)
  }

  return overlay
}

// Close and remove modal
function closeModal() {
  const overlay = document.querySelector(".modal-overlay")
  if (overlay) {
    overlay.remove()
    modalActive = false
  }
}

// Custom alert function
function showAlert(title, message) {
  return new Promise((resolve) => {
    modalActive = true
    modalCallback = resolve
    createModal(title, message, "alert")
  })
}

// Custom confirm function
function showConfirm(title, message, okText = "OK", cancelText = "Cancel") {
  return new Promise((resolve) => {
    modalActive = true
    modalCallback = resolve
    createModal(title, message, "confirm", [okText, cancelText])
  })
}

// Custom prompt function
function showPrompt(title, message) {
  return new Promise((resolve) => {
    modalActive = true
    modalInputValue = ""
    modalCallback = resolve
    createModal(title, message, "prompt")
  })
}

// Add keyboard support
document.addEventListener("keydown", (e) => {
  if (!modalActive) return

  if (e.key === "Escape") {
    closeModal()
    if (modalCallback) modalCallback(null)
  } else if (e.key === "Enter") {
    // Only auto-confirm for alert modals or if we're not in a prompt
    const promptInput = document.querySelector(".modal-input")
    if (!promptInput) {
      closeModal()
      if (modalCallback) modalCallback(true)
    }
  }
})

// Expose functions to window object
window.showAlert = showAlert
window.showConfirm = showConfirm
window.showPrompt = showPrompt
// Custom Modal System for Silk Ave

// Modal state
let modalActive = false
let modalCallback = null
let modalInputValue = ""

// Play sound function
function playModalSound(soundId) {
  try {
    const sound = document.getElementById(soundId)
    if (sound) {
      sound.currentTime = 0
      sound.play().catch((e) => console.log("Audio play failed:", e))
    }
  } catch (e) {
    console.error("Error playing sound:", e)
  }
}

// Create modal elements
function createModal(title, message, type, options = []) {
  // Create overlay
  const overlay = document.createElement("div")
  overlay.className = "modal-overlay"
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.85) !important;
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  `

  // Create container
  const container = document.createElement("div")
  container.className = "modal-container"
  container.style.cssText = `
    background-color: #111 !important;
    color: #0f0 !important;
    border: 2px solid #0f0 !important;
    box-shadow: 0 0 20px #0f0 !important;
    padding: 1.5rem;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  `

  // Create header
  const header = document.createElement("div")
  header.className = "modal-header"
  header.textContent = title
  header.style.cssText = `
    color: #0f0 !important; 
    text-shadow: 0 0 5px #0f0 !important;
    text-align: center;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  `

  // Create content
  const content = document.createElement("div")
  content.className = "modal-content"
  content.textContent = message
  content.style.cssText = `
    color: #0f0 !important;
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
    line-height: 1.5;
    white-space: pre-line;
  `

  // Create buttons container
  const buttons = document.createElement("div")
  buttons.className = "modal-buttons"
  buttons.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 1rem;
  `

  // Add input field for prompt type
  if (type === "prompt") {
    const input = document.createElement("input")
    input.type = "text"
    input.className = "modal-input"
    input.placeholder = "Enter your response..."
    input.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      width: 100%;
      padding: 0.5rem;
      margin-bottom: 1rem;
      font-family: monospace;
    `
    input.addEventListener("input", (e) => {
      modalInputValue = e.target.value
    })
    container.appendChild(header)
    container.appendChild(content)
    container.appendChild(input)

    // Focus the input after a short delay
    setTimeout(() => input.focus(), 100)
  } else {
    container.appendChild(header)
    container.appendChild(content)
  }

  // Add buttons based on type
  if (type === "alert") {
    const okButton = document.createElement("button")
    okButton.className = "modal-button"
    okButton.textContent = "OK"
    okButton.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      padding: 0.5rem 1.5rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    `
    okButton.addEventListener("click", () => {
      closeModal()
      if (modalCallback) modalCallback(true)
    })
    buttons.appendChild(okButton)
  } else if (type === "confirm") {
    // Add OK button
    const okButton = document.createElement("button")
    okButton.className = "modal-button"
    okButton.textContent = options[0] || "OK"
    okButton.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      padding: 0.5rem 1.5rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    `
    okButton.addEventListener("click", () => {
      closeModal()
      if (modalCallback) modalCallback(true)
    })

    // Add Cancel button
    const cancelButton = document.createElement("button")
    cancelButton.className = "modal-button"
    cancelButton.textContent = options[1] || "Cancel"
    cancelButton.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      padding: 0.5rem 1.5rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    `
    cancelButton.addEventListener("click", () => {
      closeModal()
      if (modalCallback) modalCallback(false)
    })

    buttons.appendChild(okButton)
    buttons.appendChild(cancelButton)
  } else if (type === "prompt") {
    // Add OK button
    const okButton = document.createElement("button")
    okButton.className = "modal-button"
    okButton.textContent = "OK"
    okButton.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      padding: 0.5rem 1.5rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    `
    okButton.addEventListener("click", () => {
      closeModal()
      if (modalCallback) modalCallback(modalInputValue)
    })

    // Add Cancel button
    const cancelButton = document.createElement("button")
    cancelButton.className = "modal-button"
    cancelButton.textContent = "Cancel"
    cancelButton.style.cssText = `
      background-color: #000 !important;
      color: #0f0 !important;
      border: 1px solid #0f0 !important;
      padding: 0.5rem 1.5rem;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    `
    cancelButton.addEventListener("click", () => {
      closeModal()
      if (modalCallback) modalCallback(null)
    })

    buttons.appendChild(okButton)
    buttons.appendChild(cancelButton)
  }

  container.appendChild(buttons)
  overlay.appendChild(container)

  // Add to document
  document.body.appendChild(overlay)

  // Play sound
  try {
    playModalSound("bleep")
  } catch (e) {
    console.log("Sound play failed:", e)
  }

  return overlay
}

// Close and remove modal
function closeModal() {
  const overlay = document.querySelector(".modal-overlay")
  if (overlay) {
    overlay.remove()
    modalActive = false
  }
}

// Custom alert function
function showAlert(title, message) {
  return new Promise((resolve) => {
    modalActive = true
    modalCallback = resolve
    createModal(title, message, "alert")
  })
}

// Custom confirm function
function showConfirm(title, message, okText = "OK", cancelText = "Cancel") {
  return new Promise((resolve) => {
    modalActive = true
    modalCallback = resolve
    createModal(title, message, "confirm", [okText, cancelText])
  })
}

// Custom prompt function
function showPrompt(title, message) {
  return new Promise((resolve) => {
    modalActive = true
    modalInputValue = ""
    modalCallback = resolve
    createModal(title, message, "prompt")
  })
}

// Add keyboard support
document.addEventListener("keydown", (e) => {
  if (!modalActive) return

  if (e.key === "Escape") {
    closeModal()
    if (modalCallback) modalCallback(null)
  } else if (e.key === "Enter") {
    // Only auto-confirm for alert modals or if we're not in a prompt
    const promptInput = document.querySelector(".modal-input")
    if (!promptInput) {
      closeModal()
      if (modalCallback) modalCallback(true)
    }
  }
})

// Expose functions to window object
window.showAlert = showAlert
window.showConfirm = showConfirm
window.showPrompt = showPrompt

export { showConfirm, showPrompt }
