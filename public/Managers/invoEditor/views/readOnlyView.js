export default function readOnlyView() {
  return {
    html: '',
    init() {
      console.log('[ readOnlyView ] Initialising.')
      fetch('/html/editor/readOnlyView.html')
        .then(res => {
          if (!res.ok) throw new Error(`readOnlyView fetch error: ${res.status}`)
          return res.text()
        })
        .then(html => {
          this.html = html
        })
        .catch(err => console.error(err))
    },
    searchQuery: '',
    invoiceItems: [],
    // Initialised in html init after this init
    invoiceGet() {
      const items = Alpine.store('edit').currentInvoice.items || []
      this.invoiceItems = [...items]
      // console.log('This invoice items: =>', this.invoiceItems)
    },

    get items() {
      const items = Alpine.store('edit').currentInvoice.items || []
      const q = this.searchQuery.trim().toLowerCase()
      return q ? items.filter(i => i.name?.toLowerCase().includes(q)) : items
    },
  }
}
