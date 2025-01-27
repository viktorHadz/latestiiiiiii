export default function invoiceList() {
  return {
    listItems: [],
    init() {
      this.fetchListById()
    },
    // MARK: FETCH INVOICE LIST
    async fetchListById() {
      try {
        const client = Alpine.store('clients').selectedClient
        console.log('Client HERE!!!!!!!!!!!', client)
        const response = await fetch(`/editor/list/${client.id}`)
        if (!response.ok) {
          throw new Error(`Error fetching invoices: ${response.statusText}`)
        }
        const data = await response.json()
        this.listItems = data
      } catch (error) {
        console.error('Error fetching invoice list items:', error)
      }
    },
    // MARK: FETCH INVOICE DATA
    async fetchItems(invoiceId) {
      const client = Alpine.store('clients').selectedClient
      const edit = Alpine.store('edit')
      if (this.editing === true) {
        const continueFunction = await this.cancelEdit()

        if (!continueFunction) {
          return
        }
      }
      try {
        const response = await fetch(`/editor/invoices/${client.id}/${invoiceId}`)
        if (!response.ok) {
          throw new Error(`Error fetching incoice items: ${response.statusText}`)
        }
        const data = await response.json()
        edit.invoiceItems = data
        edit.showEditorItems = true
      } catch (error) {
        console.error(`Error fetching invoice items: ${error}`)
      }
    },
  }
}
