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
    resetData() {
      this.styles = []
      this.samples = []
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
        console.log('[ItemsStore] Styles and samples updated for client:', clientId)
      } catch (error) {
        console.error('[ItemsStore] Error fetching styles and samples:', error)
      }
    },
  })
})
