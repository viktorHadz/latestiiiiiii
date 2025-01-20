export default function clientManager() {
  return {
    clientSearch: '',
    filteredClients: [],
    showClientModal: false,

    async init() {
      console.log('[ClientManager] initialized')
    },
    // Search clients
    searchClients() {
      this.filteredClients = this.clients.filter(client =>
        client.name.toLowerCase().includes(this.clientSearch.toLowerCase()),
      )
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
