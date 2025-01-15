// store/clientStore.js
document.addEventListener('alpine:init', () => {
  Alpine.store('clients', {
    // Data
    clients: [],
    newClient: { name: '', company_name: '', address: '', email: '' },
    selectedClient: JSON.parse(localStorage.getItem('selectedClient')) || null,

    // UI state
    showAddClientModal: false,
    showClientModal: false,
    showDropdown: false,
    isFetched: false,

    // Reactive store
    test: JSON.parse(localStorage.getItem('testRea')) || 0,

    async init() {
      console.log('[ClientStore] init() is called')
      await this.fetchClients()

      // If no clients => open "create" modal
      if (this.clients.length === 0) {
        this.showAddClientModal = true
      }
      // If clients exist but none selected => open "select" modal
      else if (!this.selectedClient) {
        this.showClientModal = true
      }
    },

    async fetchClients() {
      try {
        console.log('[ClientStore] fetching clients...')
        const response = await fetch('/clients/get')
        if (!response.ok) {
          throw new Error(`Failed to fetch clients: ${response.statusText}`)
        }
        const data = await response.json()
        this.clients = data
        this.isFetched = true
        console.log('[ClientStore] clients fetched:', data)
      } catch (error) {
        console.error('[ClientStore] Error fetching clients:', error)
      }
    },

    async addClient() {
      try {
        console.log('[ClientStore] adding client with data:', this.newClient)
        const response = await fetch('/clients/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.newClient),
        })
        if (!response.ok) {
          throw new Error(`Failed to create client: ${response.statusText}`)
        }

        const newClient = await response.json()
        // Add to local array
        this.clients.push({ ...newClient, isEditing: false })

        // Hide modal
        this.showAddClientModal = false

        // Clear form
        this.newClient = { name: '', company_name: '', address: '', email: '' }

        callSuccess('Client created', `${newClient.name} has been added.`)
        // If no selected client, open select modal
        if (!this.selectedClient) {
          this.showClientModal = true
        }
      } catch (error) {
        console.error('[ClientStore] Error adding client:', error)
        callError('Error adding client', 'Failed to add client. Please call support.')
      }
    },

    async selectClient(client) {
      this.selectedClient = client
      localStorage.setItem('selectedClient', JSON.stringify(client))
      this.showClientModal = false
      callSuccess('Client Selected', `${client.name} is now active.`)
    },

    openModal(type) {
      if (type === 'create') {
        this.showAddClientModal = true
      } else if (type === 'select') {
        this.showClientModal = true
        this.showDropdown = false
      }
    },

    closeModal(type) {
      if (type === 'create') {
        this.showAddClientModal = false
      } else if (type === 'select') {
        this.showClientModal = false
        this.showDropdown = false
      }
    },

    // Just debugging increments
    add() {
      this.test++
      localStorage.setItem('testRea', JSON.stringify(this.test))
    },

    subtract() {
      this.test--
      localStorage.setItem('testRea', JSON.stringify(this.test))
    },
  })

  // Debug effect
  Alpine.effect(() => {
    console.log('[ClientStore] reactive test:', Alpine.store('clients').test)
  })
})
