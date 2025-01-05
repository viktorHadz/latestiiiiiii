export default function itemEditor() {
  return {
    slideOverOpen: false, // Controls the visibility
    htmlSlideOver: '', // Holds the fetched HTML content
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
  }
}
