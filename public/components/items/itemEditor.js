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
      return this.styles.filter(style => style.name.includes(this.search))
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

    /// THIS WORKS
    async getStyles() {
      if (this.currentClient === null) {
        this.slideOverOpen = false
      }
      const client = JSON.parse(this.currentClient).id
      console.log('Should be this: ', client)
      try {
        const response = await fetch(`/item/styles/${client}`)
        if (!response.ok) throw new Error('Failed to fetch styles')
        this.styles = await response.json()
        console.log(this.styles)
      } catch (error) {
        console.error('Error fetching styles:', error)
      }
    },

    async getSamples() {
      const client = JSON.parse(this.currentClient)
      const response = await fetch(`/item/samples/client/${client.id}`)
      if (response.ok) {
        this.samples = await response.json()
        console.log(this.styles)
      }
    },
    async updateStyle(id, name, price) {
      try {
        this.editingSampOrStyle = 'checking'
        this.$refs.editStylePrice.focus()
        const parsedPrice = Alpine.store('price').validate(price)
        this.editingSampOrStyle = 'passed'
        const data = {
          id: id,
          name: name,
          price: parsedPrice,
        }
        console.log('Style data before update: ', data)
        const response = await fetch(`/item/styles/${id}`, {
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
        const parsedPrice = Alpine.store('price').validate(price)
        const parsedTime = Alpine.store('price').validate(time)
        this.editingSampOrStyle = 'passed'
        const data = {
          name: name,
          time: parsedTime,
          price: parsedPrice,
        }
        console.log(
          `Data to send dB: , name: ${name} - ${typeof name}, time: ${time}- ${typeof time}, price: ${parsedPrice}- ${typeof parsedPrice}, sampleId: ${sampleId} - ${typeof sampleId}`,
        )
        const response = await fetch(`/samples/${sampleId}`, {
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
  }
}
