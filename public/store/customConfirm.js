document.addEventListener('alpine:init', () => {
  Alpine.store('confirm', {
    visible: false,
    message: '',
    resolve: null,

    // Show the modal with a given message and return a Promise
    show(message) {
      this.message = message
      this.visible = true
      return new Promise(resolve => {
        this.resolve = resolve
      })
    },

    // Called when the user confirms
    confirmYes() {
      if (this.resolve) {
        this.resolve(true)
      }
      this.reset()
    },

    // Called when the user cancels
    confirmNo() {
      if (this.resolve) {
        this.resolve(false)
      }
      this.reset()
    },

    // Reset the store state
    reset() {
      this.visible = false
      this.message = ''
      this.resolve = null
    },
  })

  // Attach a global function that can be called from anywhere
  window.callConfirm = message => Alpine.store('confirm').show(message)
})
