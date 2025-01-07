export default function itemEditor() {
  return {
    slideOverOpen: true, // Controls the visibility
    htmlSlideOver: '', // Holds the fetched HTML content
    currentClient: localStorage.getItem('selectedClient'),
    styles: [],
    samples: [],
    editingStyles: false,
    editingSamples: false,

    async init() {
      console.log('[] -- component itemEditor.js -->  initialized') // Log when the component initializes
      // IF THE CURENT TAB IS INVOICE PUT THIS AS IF
      await this.loadHtmlSlideOver() // Load HTML when the component initializes
    },
    async loadHtmlSlideOver() {
      try {
        const response = await fetch('src/components/items/itemEditor.html') // Fetch the HTML file
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
      const client = JSON.parse(this.currentClient)
      const response = await fetch(`/styles/client/${client.id}`)
      if (response.ok) {
        this.styles = await response.json()
        console.log(this.styles)
      }
    },
    async getSamples() {
      const client = JSON.parse(this.currentClient)
      const response = await fetch(`/samples/client/${client.id}`)
      if (response.ok) {
        this.samples = await response.json()
        console.log(this.styles)
      }
    },
  }
}
