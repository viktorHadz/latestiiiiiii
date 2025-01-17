document.addEventListener('alpine:init', () => {
  Alpine.store('invo', {
    async init() {
      console.log('1. ##STORE##invo invoiceStore.js-"initializing":\n ')
    },
  })
})
