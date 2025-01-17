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

      Alpine.effect(() => {
        this.watchState()
      })
    },

    // Utility methods
    getSelected() {
      return JSON.parse(localStorage.getItem('selectedClient'))
    },
    setSelected(client) {
      this.selectedClient = client
      localStorage.setItem('selectedClient', JSON.stringify(client))
      console.log('[ClientStore] Selected client updated:', client)
      callSuccess(`Client selected ${client.name}`)
      if (this.showClientModal === true) {
        this.showClientModal = false
      }
    },
    killSelected() {
      this.selectedClient = null
      localStorage.removeItem('selectedClient')
      console.log('[ClientStore] Selected client cleared.')
    },

    // State watcher for side effects
    watchState() {
      if (this.clients.length === 0) {
        this.showAddClientModal = true
        callWarning('No clients', 'Please add a client to continue.')
      } else if (!this.selectedClient || !this.getSelected()) {
        this.showClientModal = true
        callWarning('No Client Selected', 'Please select a client to continue.')
      }
    },

    // CRUD Operations
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
        // Add
        const newClient = await response.json()
        this.clients.push({ ...newClient, isEditing: false })
        this.newClient = { name: '', company_name: '', address: '', email: '' }
        this.showAddClientModal = false
        callSuccess('Client created', `${newClient.name} has been added.`)

        // If no selected client, open select modal
        if (this.selectedClient === null) {
          this.setSelected(newClient)
        }
      } catch (error) {
        console.error('[ClientStore] Error adding client:', error)
        callError('Error adding client', 'Failed to add client. Please call support.')
      }
    },
    async removeClient(clientId) {
      if (confirm('Are you sure you want to remove this client?')) {
        try {
          const response = await fetch(`/clients/delete/${clientId}`, {
            method: 'DELETE',
          })
          if (!response.ok) {
            throw new Error(`Failed to delete client: ${response.statusText}`)
          }

          callInfo('Client removed')

          // Clear selectedClient if it matches the removed client
          if (this.selectedClient?.id === clientId) {
            this.killSelected()
            callWarning('Client Removed', 'Please select a new client to continue.')
            this.showClientModal = true
          }
          // Re-fetch clients from the server to maintain reactivity
          await this.fetchClients()
        } catch (error) {
          console.error('Error removing client:', error)
          callError('Failed to remove client.', 'Please try again or call support...')
        }
      }
    },
    async updateClient(client) {
      try {
        const response = await fetch(`/clients/update/${client.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: client.name,
            company_name: client.company_name,
            address: client.address,
            email: client.email,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update client: ${response.statusText}`)
        }

        const updatedClient = await response.json()
        client.isEditing = false

        if (this.selectedClient.id === client.id) {
          this.setSelected(client)
        }
        await this.fetchClients()

        callSuccess('Client Updated', 'Client details were successfully updated.')
        console.log('[ClientStore] Updated client:', updatedClient)
      } catch (error) {
        console.error('[ClientStore] Error updating client:', error)
        callError('Error updating client', 'Failed to update client. Please try again.')
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
// async selectClient(client) {
//   this.selectedClient = client
//   localStorage.setItem('selectedClient', JSON.stringify(client))
//   this.showClientModal = false
//   callSuccess('Client Selected', `${client.name} is now active.`)
// },
