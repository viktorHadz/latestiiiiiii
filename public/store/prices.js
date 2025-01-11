document.addEventListener('alpine:init', () => {
  Alpine.store('price', {
    roundToTwo(value) {
      return Math.round((value + Number.EPSILON) * 100) / 100
    },
    validate(value) {
      if (value == null || value === '' || (typeof value === 'string' && value.trim() === '') || isNaN(value)) {
        callWarning('Incorrect formatting', 'Please enter a valid numeric value (e.g. 19.99).')
        throw new Error('Prices store: Invalid number provided')
      }
      const number = parseFloat(value)
      if (isNaN(number)) {
        throw new Error('Prices store: Invalid number provided')
      }
      return this.roundToTwo(number)
    },
    // Displays price as pounds on the frontend
    displayPrice(num) {
      const numFormat = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
      })
      return numFormat.format(num)
    },
  })
})
