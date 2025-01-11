export default function itemEditor() {
  return {
    slideOverOpen: true, // Controls the visibility
    htmlSlideOver: '', // Holds the fetched HTML content
    currentClient: localStorage.getItem('selectedClient'),
    styles: [],
    samples: [],
    editingSampOrStyle: 'static',
    search: '',

    get searchFilterStyle() {
      return this.styles.filter(style => style.name.includes(this.search))
    },
    get searchFilterSample() {
      return this.samples.filter(style => style.name.includes(this.search))
    },

    async init() {
      console.log('[] -- component itemEditor.js -->  initialized')
      await this.loadHtmlSlideOver() // Load HTML when the component initializes
      if (this.currentClient === null && this.slideOverOpen === true) {
        console.warn('No client found in localStorage. Closing slideover.')
        this.slideOverOpen = false
        return
      }
    },
    async loadHtmlSlideOver() {
      try {
        const response = await fetch('/components/items/itemEditor.html') // Fetch the HTML file
        if (response.ok) {
          this.htmlSlideOver = await response.text() // Assign the fetched HTML to the property
        } else {
          throw new Error(`Failed to fetch: ${response.status}`)
        }
      } catch (error) {
        console.error('Error loading HTML SlideOver:', error)
      }
    },

    async getStyles() {
      if (this.currentClient === null) {
        this.slideOverOpen = false
      }
      const client = JSON.parse(this.currentClient).id
      console.log('Should be this: ', client)
      try {
        const response = await fetch(`/item/styles/client/${client}`)
        if (!response.ok) throw new Error('Failed to fetch styles')
        this.styles = await response.json()
        console.log(this.styles)
      } catch (error) {
        console.error('Error fetching styles:', error)
      }
    },
    async getSamples() {
      if (this.currentClient === null) {
        this.slideOverOpen = false
      }
      const client = JSON.parse(this.currentClient).id
      try {
        const response = await fetch(`/item/samples/client/${client}`)
        if (!response.ok) throw new Error('Failed to fetch samples')
        this.samples = await response.json()
        console.log(this.samples)
      } catch (error) {
        console.error('Error fetching samples:', error)
      }
    },

    async updateStyle(id, name, price) {
      try {
        this.editingSampOrStyle = 'checking'
        this.$refs.editStylePrice.focus()

        const validatedPrice = Alpine.store('price').validate(price)
        this.editingSampOrStyle = 'passed'
        const data = {
          id: id,
          name: name,
          price: validatedPrice,
        }

        console.log('Style data before update: ', data)
        const response = await fetch(`/item/styles/update/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: { 'Content-type': 'application/json; charset=UTF-8' },
        })
        console.log('StyleResponse from db: ', response)
      } catch (error) {
        console.error('Update aborted: ', error.message)
      }
    },
    async updateSample(name, time, price, sampleId) {
      try {
        this.editingSampOrStyle = 'checking'
        this.$refs.editSampleTime.focus()
        const validatedPrice = Alpine.store('price').validate(price)
        const validatedTime = Alpine.store('price').validate(time)
        this.editingSampOrStyle = 'passed'
        const data = {
          name: name,
          time: validatedTime,
          price: validatedPrice,
        }
        console.log(
          `Data to send dB: , name: ${name} - ${typeof name}, time: ${time}- ${typeof time}, price: ${validatedPrice}- ${typeof validatedPrice}, sampleId: ${sampleId} - ${typeof sampleId}`,
        )
        const response = await fetch(`/item/samples/update/${sampleId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: { 'Content-type': 'application/json; charset=UTF-8' },
        })
        if (!response.ok) {
          throw new Error(`Failed to update sample: ${response.statusText}`)
        }
        console.log('Sample updated successfully', await response.json())
      } catch (error) {
        console.error('Update aborted: ', error.message)
      }
    },

    deleteStyle(id) {
      if (confirm('Are you sure you want to delete this style?')) {
        fetch(`/item/styles/delete/${id}`, { method: 'DELETE' })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to delete style: ${response.statusText}`)
            }
            console.log('Style deleted successfully')
            this.getStyles()
          })
          .catch(error => console.error('Error deleting style:', error))
      }
    },
    deleteSample(sampleId) {
      if (confirm('Are you sure you want to delete this sample?')) {
        fetch(`/item/samples/delete/${sampleId}`, { method: 'DELETE' })
          .then(response => {
            if (!response.ok) {
              throw new Error(`Failed to delete sample: ${response.statusText}`)
            }
            console.log('Sample deleted successfully')
            this.getSamples()
          })
          .catch(error => console.error('Error deleting sample:', error))
      }
    },
  }
}
