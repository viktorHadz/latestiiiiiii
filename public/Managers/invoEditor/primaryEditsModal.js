// primaryEditsModal.js
export default function primaryEditsModal() {
  return {
    html: '',
    existingItems: [],
    invoiceItems: [],
    searchQuery: '',

    init() {
      console.log('[primaryEditsModal] Initialising')
      // If you need HTML from the server:
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

    // Called after `init()` or on your own
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

    // Example if you eventually add items to the invoice
    addToInvoice(originalItem) {
      // ...
    },
  }
}
