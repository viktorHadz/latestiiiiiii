document.addEventListener('alpine:init', () => {
  Alpine.store('items', {
    modalStyle: false,
    modalSample: false,
    item: {
      name: '',
      price: null,
      time: null,
    },
    selectedClient: JSON.parse(localStorage.getItem('selectedClient')) || null,
    async addStyle() {
      console.log({ name: this.item.name, price: this.item.price, client_id: this.selectedClient.id })
      const response = await fetch('/item/styles/new', {
        method: 'POST',
        body: JSON.stringify({
          name: this.item.name,
          price: this.item.price,
          client_id: Alpine.store('clients').clients.id,
        }),
      })

      if (!response.ok) {
        console.error('Failed to add style')
      }
    },
    // addSample() {},
  })
})
