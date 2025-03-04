document.addEventListener('alpine:init', () => {
  Alpine.store('makeTable', {
    make(keyPrefix) {
      // Return a reactive Alpine component
      return {
        items: [], // local copy of the store’s items
        searchQuery: '',
        get filteredItems() {
          const q = this.searchQuery.trim().toLowerCase()
          return q ? this.items.filter(item => item.name.toLowerCase().includes(q)) : this.items
        },

        init() {
          // Use Alpine.effect to watch for store changes
          Alpine.effect(() => {
            // On each render pass, read the store's items
            const newItems = Alpine.store('edit').currentInvoice.items
            // Assign them to our local `items` array
            this.items = newItems
          })
        },
      }
    },
  })
})
