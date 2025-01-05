document.addEventListener('alpine:init', () => {
    Alpine.store('clientStore', {
      clients: [],
  
      async init() {
        console.log('1. OO--> clientStore is initialized')
        try {
          await this.fetchClients() // Corrected: removed redundant await response
          console.log(' _ "Clients fetched from store and ready to use"\n', this.clients)
        } catch (error) {
          console.error('Error initializing clients:', error)
        }
      },
  
      async fetchClients() {
        try {
          const response = await fetch('/clients')
          const data = await response.json()
          this.clients = data
          return this.clients
        } catch (error) {
          console.error('Error fetching clients:', error)
        }
      },
    })
  })
  