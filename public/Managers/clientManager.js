export default function clientManager() {
  return {
    clientSearch: '',
    filteredClients: [],
    showClientModal: false,

    async init() {
      console.log('>>---- ClientManager --> initialized')
      this.clients = Alpine.store('clients').clients
    },
    // Search clients
    searchClients() {
      this.filteredClients = this.clients.filter(client =>
        client.name.toLowerCase().includes(this.clientSearch.toLowerCase()),
      )
    },

    // async fetchClients() {
    //   try {
    //     const response = await fetch('/clients/get')
    //     this.clients = (await response.json()).map(client => ({
    //       ...client,
    //       isEditing: false,
    //     }))
    //     this.filteredClients = this.clients
    //   } catch (error) {
    //     console.error('Error fetching clients:', error)
    //   }
    // },

    async updateClient(client) {
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
      client.isEditing = false
      await Alpine.store('clients').fetchClients()

      callSuccess('Edit successful', 'Changes saved.')
      return await response.json()
    },

    async removeClient(clientId) {
      console.log('ClientId: ', clientId, '\n Client: ', this.clients)
      if (confirm('Are you sure you want to remove this client?')) {
        try {
          const response = await fetch(`/clients/delete/${clientId}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error(`Failed to delete client: ${response.statusText}`)
          }

          await Alpine.store('clients').fetchClients()
          callSuccess('Client removed')
        } catch (error) {
          console.error('Error removing client:', error)
          callError('Failed to remove client.', 'Please try again or call support...')
        }
      }
    },

    editClient(client) {
      client.original = { ...client } // Store original data
      client.isEditing = true
    },

    cancelEdit(client) {
      Object.assign(client, client.original) // Revert to original data
      client.isEditing = false
      callSuccess('Edit canceled.', 'No changes were saved.')
    },
  }
}
