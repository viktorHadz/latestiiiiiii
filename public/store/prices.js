document.addEventListener('alpine:init', () => {
  Alpine.store('price', {
    validate(value) {
      if (value == null || value === '' || (typeof value === 'string' && value.trim() === '') || isNaN(value)) {
        callWarning('Incorrect formatting', 'Please enter a valid numeric value.')
        throw new Error('Prices store: Invalid number provided')
      }
      const number = parseFloat(value)
      if (isNaN(number)) {
        throw new Error('Prices store: Invalid number provided')
      }

      return this.roundToTwo(number)
    },

    roundToTwo(value) {
      return Number(value.toFixed(2))
    },
  })
})
