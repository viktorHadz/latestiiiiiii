export default function parentEditView() {
  return {
    // For optional HTML injection if needed
    html: '',

    // Search fields
    searchExisting: '',
    searchInvoice: '',

    invoiceItems: [],
    existingItems: [],

    init() {
      console.log('[parentEditView] Initializing...')

      // Optional external snippet fetch
      // If you open the modal multiple times, make sure you’re not calling `init()` again each time
      fetch('/html/editor/parentEditView.html')
        .then(res => {
          if (!res.ok) throw new Error(`Bad HTML fetch ${res.status}`)
          return res.text()
        })
        .then(html => {
          this.html = html
          this.invoiceGet()
          this.existingGet()
        })
        .catch(err => console.error(err))
    },

    // Load the initial invoice items from your store
    invoiceGet() {
      console.log('[parentEditView] Loading invoice items from store')
      const editStore = Alpine.store('edit')
      this.invoiceItems = editStore.currentInvoice?.items ? [...editStore.currentInvoice.items] : []
    },
    get filteredExisting() {
      const query = this.searchExisting.trim().toLowerCase()
      return query ? this.existingItems.filter(item => item.name?.toLowerCase().includes(query)) : this.existingItems
    },
    // Load the available existing items from your store
    existingGet() {
      console.log('[parentEditView] Loading existing items from store')
      const itemStore = Alpine.store('items')
      this.existingItems = itemStore.mergedItems ? itemStore.mergedItems.map(item => ({ ...item, quantity: 1 })) : []
    },
    get filteredInvoice() {
      const query = this.searchInvoice.trim().toLowerCase()
      return query ? this.invoiceItems.filter(item => item.name?.toLowerCase().includes(query)) : this.invoiceItems
    },
    isMatchingItem(invoiceItem, existingItem) {
      return invoiceItem.origin_id === existingItem.id && invoiceItem.type === existingItem.type
    },
    increaseQty(item) {
      // Get the input quantity directly from the DOM instead of relying on reactivity
      const inputElement = document.getElementById(`ii-${item.id}`)
      const inputQuantity = inputElement ? parseInt(inputElement.value, 10) || 1 : 1

      // Find the existing item in the invoice
      const index = this.invoiceItems.findIndex(i => this.isMatchingItem(i, item))

      if (index !== -1) {
        // Update quantity directly without redundant reactivity triggers
        this.invoiceItems[index].quantity += inputQuantity
        this.invoiceItems[index].total_item_price = this.invoiceItems[index].price * this.invoiceItems[index].quantity
      } else {
        // Push new item, but keep it lean
        this.invoiceItems.push({
          id: item.id,
          origin_id: item.id, // Set origin_id explicitly
          name: item.name,
          type: item.type,
          price: item.price,
          quantity: inputQuantity,
          total_item_price: item.price * inputQuantity,
        })
      }
      Alpine.store('edit').calculateTotals()
    },
  }
}
