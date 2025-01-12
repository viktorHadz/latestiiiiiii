document.addEventListener('alpine:init', () => {
  Alpine.store('clients', {
    clients: [],
    selectedClient: JSON.parse(localStorage.getItem('selectedClient')) || null,
    showClientModal: false,

    test: JSON.parse(localStorage.getItem('testRea')) || 0,

    async init() {
      console.log('1. OO--> clientStore is initialized')
      await this.fetchClients()

      if (!this.selectedClient) {
        callWarning('No client selected', 'Please select one to continue')
        this.showClientModal = true
      }
    },
    async fetchClients() {
      try {
        const response = await fetch('/clients/get')
        const data = await response.json()
        this.clients = data
        return this.clients
      } catch (error) {
        console.error('Error fetching clients:', error)
      }
    },
    async selectClient(client) {
      this.selectedClient = client
      localStorage.setItem('selectedClient', JSON.stringify(client))
      this.showClientModal = false
      callSuccess('Client Selected', `${client.name} is now active.`)
    },

    openModal() {
      this.showClientModal = true
      if (this.showDropdown === true) {
        this.showDropdown = false
      }
    },

    closeModal() {
      this.showClientModal = false
      if (this.showDropdown === true) {
        this.showDropdown = false
      }
    },
    add() {
      this.test++
      localStorage.setItem('testRea', JSON.stringify(this.test))
    },

    subtract() {
      this.test--
      localStorage.setItem('testRea', JSON.stringify(this.test))
    },
  })

  Alpine.effect(() => {
    console.log('ClientStore test value changed:', Alpine.store('clients').test)
  })
})
