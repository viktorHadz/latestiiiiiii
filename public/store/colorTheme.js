document.addEventListener('alpine:init', () => {
  Alpine.store('colorTheme', {
    darkTheme: localStorage.getItem('darkTheme') === 'true', // Load the theme from localStorage
    async init() {
      console.log('00--> ColorTheme store initialized')
      document.documentElement.classList.toggle('dark', this.darkTheme)
    },
    toggleTheme() {
      this.darkTheme = !this.darkTheme
      localStorage.setItem('darkTheme', this.darkTheme) // Save theme to localStorage
      document.documentElement.classList.toggle('dark', this.darkTheme)
    },
  })
})
