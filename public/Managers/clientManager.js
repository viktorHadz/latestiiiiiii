export default function clientManager() {
  return {
    clients: [],
    newClient: { name: '', company_name: '', address: '', email: '' },
    showAddClientModal: false,
    clientSearch: '',
    filteredClients: [],
    showClientModal: false,

    async init() {
      console.log('>>---- ClientManager --> initialized')
      await this.fetchClients()
    },
    // Search clients
    searchClients() {
      this.filteredClients = this.clients.filter(client =>
        client.name.toLowerCase().includes(this.clientSearch.toLowerCase()),
      )
    },
    async fetchClients() {
      try {
        const response = await fetch('/clients/get')
        this.clients = (await response.json()).map(client => ({
          ...client,
          isEditing: false,
        }))
        this.filteredClients = this.clients
      } catch (error) {
        console.error('Error fetching clients:', error)
      }
    },

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
      this.fetchClients()
      callSuccess('Edit successful', 'Changes saved.')
      return await response.json()
    },

    async removeClient(clientId) {
      if (confirm('Are you sure you want to remove this client?')) {
        await fetch(`/clients/delete/${clientId}`, {
          method: 'DELETE',
        })
        this.fetchClients()
      } else {
        return
      }
      callSuccess('Client removed')
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

    async addClient() {
      try {
        const newClient = await this.sendRequest('/clients/create', 'POST', this.newClient)
        this.clients.push({ ...newClient, isEditing: false })
        this.showAddClientModal = false
        // Clear the form
        this.newClient = { name: '', company_name: '', address: '', email: '' }
        callSuccess('Client added', 'New client added.')
      } catch (error) {
        console.error('Error adding client:', error)
        this.callError('Error adding client', 'Failed to add client.')
      }
    },

    async sendRequest(url, method, body) {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      return await response.json()
    },
  }
}
