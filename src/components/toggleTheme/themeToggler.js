export default function themeToggler() {
  return {
    mode: Alpine.$persist('light'),
    togglerHtml: '',
    async init() {
      console.log('[]-- component themeToggler.js --> initialized') // Log when the component initializes
      this.toggleTheme()
      // IF THE CURENT TAB IS INVOICE PUT THIS AS IF
      await this.loadTogglerHtml() // Load HTML when the component initializes
    },
    async loadTogglerHtml() {
      try {
        const response = await fetch('src/components/toggleTheme/themeToggler.html') // Fetch the HTML file
        if (response.ok) {
          this.togglerHtml = await response.text() // Assign the fetched HTML to the property
        } else {
          throw new Error(`Failed to fetch: ${response.status}`)
        }
      } catch (error) {
        console.error('Error loading HTML SlideOver:', error)
      }
    },
    toggleTheme() {
      this.mode = this.mode === 'light' ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', this.mode === 'dark')
      console.log(this.mode)
    },
  }
}
