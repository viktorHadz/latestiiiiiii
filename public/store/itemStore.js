document.addEventListener('alpine:init', () => {
  Alpine.store('items', {
    styles: [],
    samples: [],

    setStyles(styles) {
      this.styles = styles
    },
    setSamples(samples) {
      this.samples = samples
    },

    addStyle(style) {
      if (!style || typeof style.name !== 'string' || !style.name.trim()) {
        console.error('Invalid style provided:', style)
        return
      }
      this.styles.push({ ...style })
    },
    addSample(sample) {
      if (!sample || typeof sample.name !== 'string' || !sample.name.trim()) {
        console.error('Invalid sample provided:', sample)
        return
      }
      this.samples.push({ ...sample })
    },

    updateStyle(updatedStyle) {
      const index = this.styles.findIndex(s => s.id === updatedStyle.id)
      if (index !== -1) this.styles.splice(index, 1, updatedStyle)
    },
    updateSample(updatedSample) {
      const index = this.samples.findIndex(s => s.id === updatedSample.id)
      if (index !== -1) this.samples.splice(index, 1, updatedSample)
    },

    deleteStyle(id) {
      this.styles = this.styles.filter(s => s.id !== id)
    },
    deleteSample(id) {
      this.samples = this.samples.filter(s => s.id !== id)
    },

    async fetchStyles(clientId) {
      try {
        const response = await fetch(`/item/styles/client/${clientId}`)
        if (!response.ok) {
          callError('Failed to fetch styles.', 'Please try again or contact support.')
          throw new Error('Failed to fetch styles.')
        }

        this.styles = (await response.json()).map(style => ({ ...style }))
      } catch (error) {
        console.error('Error fetching styles:', error)
        callError('Error fetching styles.', 'Please try again or contact support.')
      }
    },

    async fetchSamples(clientId) {
      try {
        const response = await fetch(`/item/samples/client/${clientId}`)
        if (!response.ok) {
          callError('Failed to fetch samples.', 'Please try again or contact support.')
          throw new Error('Failed to fetch styles.')
        }
        this.samples = (await response.json()).map(sample => ({
          ...sample,
        }))
      } catch (error) {
        console.error('Error fetching samples:', error)
        callError('Please try again or contact support.')
      }
    },
  })
})
