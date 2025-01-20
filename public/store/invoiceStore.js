document.addEventListener('alpine:init', () => {
  Alpine.store(
    'invo',
    Alpine.reactive({
      totals: {
        clientId: null,
        items: [],
        discountType: 0, // 0: flat, 1: percent
        discountValue: 0,
        vatPercent: 20,
        vat: 0,
        subtotal: 0,
        total: 0,
        depositType: 0, // 0: flat, 1: percent
        depositValue: 0,
        depositPercentValue: 0,
        note: '',
        totalPreDiscount: 0,
        date: new Date().toLocaleDateString(),
      },
      quantities: {},

      // Initialize the store
      init() {
        console.log('{ InvoiceStore } Initializing')
        this.loadFromLocalStorage()
        this.syncClientId()
      },
      // Sync totals to localStorage on any change
      saveToLocalStorage() {
        localStorage.setItem('invoiceTotals', JSON.stringify(this.totals))
      },
      // Load totals from localStorage
      loadFromLocalStorage() {
        const storedTotals = localStorage.getItem('invoiceTotals')
        if (storedTotals) {
          Object.assign(this.totals, JSON.parse(storedTotals))
        }
      },
      // Automatically update clientId when the selected client changes
      syncClientId() {
        Alpine.effect(() => {
          const selectedClient = Alpine.store('clients').selectedClient
          this.totals.clientId = selectedClient ? selectedClient.id : null
        })
      },

      handleInvoQtySubmit(item) {
        return this.quantityInput[item.id] || 1
      },

      addItemToInvoice(item, type) {
        if (this.totals.discountValue !== 0 || this.totals.depositValue !== 0) {
          callWarning(
            'Cannot add items.',
            this.deposit !== 0 ? 'Remove deposit and try again.' : 'Remove discount and try again.',
          )
          return
        }
        const qty = Math.max(this.quantities[item.id] || 1, 1)
        const existingItem = this.totals.items.find(i => i.id === item.id)

        if (!existingItem) {
          this.totals.items.push({
            ...item,
            type,
            quantity: qty,
            price: parseFloat(item.price) * (type === 'sample' ? parseFloat(item.time) : 1),
          })
        } else {
          existingItem.quantity += qty
          if (type === 'sample') {
            existingItem.price = parseFloat(item.price) * parseFloat(item.time)
          }
        }
      },
      addItemAnimation(itemId) {
        const targetItem = document.getElementById(itemId)
        if (!targetItem) {
          console.error(`Element with ID "${itemId}" not found.`)
          return
        }

        console.log('Target Item:', targetItem)
        const glowClass = this.mode === 'dark' ? 'add-item-glow-dark' : 'add-item-glow'

        // Apply the glow effect
        targetItem.classList.remove(glowClass)
        void targetItem.offsetWidth
        targetItem.classList.add(glowClass)

        // Remove the class once the animation finishes
        targetItem.addEventListener(
          'animationend',
          () => {
            targetItem.classList.remove(glowClass)
          },
          { once: true }, // Ensure the listener is removed after one execution
        )
      },
      totalsReset() {
        this.totals = {
          clientId: null,
          items: [],
          discountType: 0,
          discountValue: 0,
          vatPercent: 20,
          vat: 0,
          subtotal: 0,
          total: 0,
          depositType: 0,
          depositValue: 0,
          depositPercentValue: 0,
          note: '',
          totalPreDiscount: 0,
          date: new Date().toLocaleDateString(),
        }
      },
      //rest
    }),
  )

  // Automatically save totals to localStorage when any property changes
  Alpine.effect(() => {
    const store = Alpine.store('invo')
    JSON.stringify(store.totals) // Trigger reactive tracking
    store.saveToLocalStorage()
  })
  // Empty totals on client change
  Alpine.effect(() => {
    const store = Alpine.store('invo')
    JSON.stringify(store.totals.clientId)
    store.totalsReset()
    console.log(`Client changed totals reset`)
  })
})

// document.addEventListener('alpine:init', () => {
//   Alpine.store(
//     'invo',
//     Alpine.reactive({
//       totals: {
//         clientId: null,
//         // items: 'this.invoiceItems',
//         // discountType: percent ?? flat //has to be 0 or 1 ,
//         // discountValue: XXXX // this will come from teh calculations,
//         // vatPercent: 20, // always it is meaningless but ill keep for now to avoid reworking db
//         // vat: this.vat,
//         // subtotal: this.staticSubtotal,
//         // total: this.total,
//         // depositValue: this.deposit,
//         // depositType: this.deposit,
//         // depositPercentValue: this.tempDeposit !== 0 ? this.tempDeposit : 0,
//         // note: this.invoiceNote,
//         // totalPreDiscount: this.preDiscountTotal,
//         // date: new Date().toLocaleDateString(),
//       },
//       subtotal: null,
//       vat: null,
//       total: null,
//       discount: null,
//       deposit: null,
//       note: 'hey',

//       async init() {
//         console.log('[invo] invoiceStore.js initializing')
//         // initializing the client by using clientStore computed getter
//         this.totals.clientId = Alpine.store('clients').getSelected().id
//         console.log('Selected client from store computed: ', this.totals.clientId)
//         this.reactiveChange()
//       },
//       reactiveChange() {
//         this.note = 'Na kakati huq'
//       },
//       setTotalsLs() {},
//       getTotalsLs() {},
//       removeTotalsLs() {},

//       // In here I want to expose methods for my business logic that I can track with effect to change the values of the totals object
//     }),
//   )
// 1) Effect to save invoiceTotals on changes
// Alpine.effect(() => {
//   JSON.stringify(Alpine.store('invo').totals)
//   localStorage.setItem('invoiceTotals', JSON.stringify(Alpine.store('invo').totals))
// }),
//   // 2) Effect to keep invo.totals.clientId in sync with clients.selectedClient
//   Alpine.effect(() => {
//     const selected = Alpine.store('clients').selectedClient
//     Alpine.store('invo').totals.clientId = selected ? selected.id : null
//   })
// Alpine.effect(() => {
//   const selectedClient = Alpine.store('clients').selectedClient;
//   if (selectedClient) {
//     Alpine.store('invo').totals.clientId = selectedClient.id;
//     localStorage.setItem('invoiceTotals', JSON.stringify(Alpine.store('invo').totals));
//   }
// }),
// Alpine.effect(() => {
//   const selected = Alpine.store('clients').selectedClient

//   const {
//     clientId,
//     items,
//     discountType,
//     discountValue,
//     vatPercent,
//     vat,
//     subtotal,
//     total,
//     depositValue,
//     depositType,
//     depositPercentValue,
//     note,
//     totalPreDiscount,
//     date,
//   } = Alpine.store('invo').totals
//   Alpine.store('invo').totals.clientId = selected ? selected.id : null
//   localStorage.setItem('invoiceTotals', JSON.stringify(Alpine.store('invo').totals))
// }),
// Keeps clientId in invo in sync with store clients.selectedClient
// Alpine.effect(() => {
//   const selected = Alpine.store('clients').selectedClient
//   Alpine.store('invo').totals.clientId = selected ? selected.id : null
//   localStorage.setItem('invoiceTotals', JSON.stringify(Alpine.store('invo').totals))
// }),
// })
