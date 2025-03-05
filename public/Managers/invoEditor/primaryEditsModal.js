// primaryEditsModal.js
export default function primaryEditsModal() {
  return {
    html: '',
    existingItems: [],
    invoiceItems: [],
    searchQuery: '',
    searchQuery2: '',

    init() {
      console.log('[primaryEditsModal] Initialising')
      fetch('/html/editor/primaryEdits.html')
        .then(res => {
          if (!res.ok) throw new Error(`Bad html fetch ${res.status}`)
          return res.text()
        })
        .then(html => {
          this.html = html
        })
        .catch(err => console.error(err))
    },

    // Called after `init()`
    existingGet() {
      const initialItems = Alpine.store('edit').styleAndSample || []
      // Shallow clone or just reference
      this.existingItems = [...initialItems]
      console.log('Existing items =>', this.existingItems)
    },
    // "computed" for filtering
    get existing() {
      const q = this.searchQuery.trim().toLowerCase()
      return q ? this.existingItems.filter(item => item.name?.toLowerCase().includes(q)) : this.existingItems
    },
    invoiceGet() {
      const invoItems = Alpine.store('edit').currentInvoice.items || []
      // Shallow clone or just reference
      this.invoiceItems = [...invoItems]
      console.log('This invoice items: =>', this.invoiceItems)
    },
    // computed for invoice filtering
    // get invoice() {
    //   const q = this.searchQuery2.trim().toLowerCase()
    //   return q ? this.invoiceItems.filter(item => item.name?.toLowerCase().includes(q)) : this.invoiceItems
    // },
    get invoice() {
      const items = Alpine.store('edit').currentInvoice.items || []
      const q = this.searchQuery2.trim().toLowerCase()
      return q ? items.filter(i => i.name?.toLowerCase().includes(q)) : items
    },
    // Example if you eventually add items to the invoice
    addExistingToInvoice(item) {
      const storeEdit = Alpine.store('edit')
      console.log('[addExistingToInvoice] Adding item:', item)
      // Check for existing item using origin_id + type ...
      const existingItem = storeEdit.currentInvoice.items.find(
        i =>
          i.id === item.id &&
          i.invoice_id === item.invoice_id &&
          i.name === item.name &&
          i.type === item.type &&
          i.origin_id === item.origin_id,
      )

      const quantity = item.quantity || 1

      if (existingItem) {
        console.log('[addExistingToInvoice] Item already exists, increasing quantity.')
        existingItem.quantity += quantity
        existingItem.total_item_price = existingItem.price * existingItem.quantity
      } else {
        if (item.type === 'sample' && (!item.time || isNaN(item.time) || item.time <= 0)) {
          callError('Invalid Time', 'Samples require a valid time greater than 0.')
          return
        }
        const newItem = {
          ...item,
          quantity: quantity,
          total_item_price: item.price * quantity,
        }

        console.log('[addExistingToInvoice] Adding new dropdown item:', newItem)
        storeEdit.currentInvoice.items = [...storeEdit.currentInvoice.items, newItem]
      }

      storeEdit.calculateTotals()
    },
  }
}
