// import clientSelect from './clientSelect.js'
import tabsInvoice from './tabsInvoice.js'
import invoicing from './invoiceSection.js'
import totalsInvoice from './totalsInvoice.js'

export default function invoiceManager2() {
  return {
    init() {
      // Register the component
      Alpine.data('tabsInvoice', tabsInvoice)
      Alpine.data('invoicing', invoicing)
      Alpine.data('totalsInvoice', totalsInvoice)

      this.fileFetcher('/html/invoices/tabsInvoice.html', '#tabs-invoice')
      this.fileFetcher('/html/invoices/invoiceSection.html', '#invo-section')
      this.fileFetcher('/html/invoices/totals.html', '#invo-totals')
    },
    fileFetcher(file, target) {
      fetch(file)
        .then(res => res.text())
        .then(html => {
          const targetElement = document.querySelector(target)
          targetElement.innerHTML = html

          // Reinitialize Alpine on the injected content
          Alpine.initTree(targetElement)
        })
        .catch(err => console.error('Error fetching file:', err))
    },
  }
}
