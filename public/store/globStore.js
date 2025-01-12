document.addEventListener('alpine:init', () => {
  Alpine.store('globStore', {
    tabSelected: '',

    init() {
      console.log('4. ##STORE## globStore.js-"initializing":\n ')

      this.tabSelected = this.getCurrentTab()
      Alpine.effect(() => {
        console.log(` _GlobWatcher: tabSelected changed to ${this.tabSelected}`)
      })
    },

    getCurrentTab() {
      let t = localStorage.getItem('_x_tabSelected', JSON.stringify())
      return t
    },
    async fetchClients() {
      try {
        const response = await fetch('/clients')
        this.clients = (await response.json()).map(client => ({
          ...client,
          isEditing: false,
        }))
        this.filteredClients = this.clients
      } catch (error) {
        console.error('Error fetching clients:', error)
      }
    },
  })
})
