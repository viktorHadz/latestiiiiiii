import clientSelect from './clientSelect.js'
import invoiceTabs from './invoiceTabs.js'

export default function invoiceManager2() {
  return {
    init() {
      // Register the `clientSelect` component
      Alpine.data('clientSelect', clientSelect)
      Alpine.data('invoiceTabs', invoiceTabs)

      this.fileFetcher('/html/invoices/clientSelect.html', '#client-select')
      this.fileFetcher('/html/invoices/invoiceTabs.html', '#tabs-invoice')
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
