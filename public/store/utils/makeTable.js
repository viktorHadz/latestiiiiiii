document.addEventListener('alpine:init', () => {
  Alpine.store('makeTable', {
    instanceCount: 0,
    instances: {},
    init() {
      console.log('{ makeTable initializing }')
    },

    make(itemsArray, sourceType = 'custom') {
      this.instanceCount++
      const tableInstance = Alpine.reactive({
        items: Alpine.reactive(itemsArray), // Ensure reactivity
        searchQuery: '',
        sourceType, // Track data source explicitly
        get filteredItems() {
          const query = this.searchQuery.trim().toLowerCase()
          return query ? this.items.filter(item => item.name.toLowerCase().includes(query)) : this.items
        },
      })

      if (sourceType !== 'custom') {
        Alpine.effect(() => {
          const editStore = Alpine.store('edit')
          let newItems

          if (tableInstance.sourceType === 'invoiceItems') {
            newItems = editStore.currentInvoice.items
          } else if (tableInstance.sourceType === 'styleAndSample') {
            newItems = editStore.styleAndSample
          } else if (tableInstance.sourceType === 'both') {
            // Combine both data sources
            newItems = [...editStore.currentInvoice.items, ...editStore.styleAndSample]
          }

          if (newItems) {
            console.log(`[Alpine.effect] ${sourceType} changed, updating table:`, newItems)
            tableInstance.items = newItems
          }
        })
      }

      return tableInstance
    },
  })
})
