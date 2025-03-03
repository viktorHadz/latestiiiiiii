document.addEventListener('alpine:init', () => {
  Alpine.store('makeTable', {
    make(arrayRef, keyPrefix) {
      return {
        searchQuery: '',
        get filteredItems() {
          const query = this.searchQuery.trim().toLowerCase()
          return query ? arrayRef.filter(item => item.name.toLowerCase().includes(query)) : arrayRef
        },
        getKey(item) {
          // Include a prefix so we never clash
          return `${keyPrefix}-${item.id}`
        },
      }
    },
  })
})
