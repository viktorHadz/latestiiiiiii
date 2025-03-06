document.addEventListener('alpine:init', () => {
  Alpine.store('items', {
    styles: [],
    samples: [],
    mergedItems: [], // Merged array of styles & samples

    setStyles(styles) {
      this.styles = styles
      this.updateExistingItems()
    },
    setSamples(samples) {
      this.samples = samples
      this.updateExistingItems()
    },

    addStyle(style) {
      if (!style || typeof style.name !== 'string' || !style.name.trim()) {
        console.error('Invalid style provided:', style)
        return
      }
      this.styles.push({ ...style })
      this.updateExistingItems()
    },
    addSample(sample) {
      if (!sample || typeof sample.name !== 'string' || !sample.name.trim()) {
        console.error('Invalid sample provided:', sample)
        return
      }
      this.samples.push({ ...sample })
      this.updateExistingItems()
    },

    updateStyle(updatedStyle) {
      const index = this.styles.findIndex(s => s.id === updatedStyle.id)
      if (index !== -1) this.styles.splice(index, 1, updatedStyle)
      this.updateExistingItems()
    },
    updateSample(updatedSample) {
      const index = this.samples.findIndex(s => s.id === updatedSample.id)
      if (index !== -1) this.samples.splice(index, 1, updatedSample)
      this.updateExistingItems()
    },

    deleteStyle(id) {
      this.styles = this.styles.filter(s => s.id !== id)
      this.updateExistingItems()
    },
    deleteSample(id) {
      this.samples = this.samples.filter(s => s.id !== id)
      this.updateExistingItems()
    },

    resetData() {
      this.styles = []
      this.samples = []
      this.mergedItems = []
    },

    async fetchStylesAndSamples(clientId) {
      try {
        const [stylesRes, samplesRes] = await Promise.all([
          fetch(`/item/styles/client/${clientId}`),
          fetch(`/item/samples/client/${clientId}`),
        ])

        if (!stylesRes.ok || !samplesRes.ok) {
          throw new Error('Failed to fetch styles or samples.')
        }

        this.styles = await stylesRes.json()
        this.samples = await samplesRes.json()
        this.updateExistingItems()
        console.log('[ItemsStore] Styles and samples updated for client:', clientId)
      } catch (error) {
        console.error('[ItemsStore] Error fetching styles and samples:', error)
      }
    },

    // Merging styles & samples into a single array
    updateExistingItems() {
      this.mergedItems = [
        ...this.styles.map(style => ({
          ...style,
          type: 'style',
          quantity: style.quantity || 1,
          time: style.time || 'N/A',
          frontendId: `style-${style.id}`,
        })),
        ...this.samples.map(sample => ({
          ...sample,
          type: 'sample',
          quantity: sample.quantity || 1,
          time: sample.time || 'N/A',
          frontendId: `sample-${sample.id}`,
        })),
      ]
    },
  })
})
