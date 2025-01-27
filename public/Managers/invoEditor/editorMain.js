import invoiceList from './invoiceList.js'
import editView from './editView.js'

export default function editorMain() {
  return {
    init() {
      Alpine.data('invoiceList', invoiceList)
      Alpine.data('editView', editView)
      console.log('[EditorMain] Initialized')
      this.fileFetcher('/html/editor/invoiceList.html', '#invo-list')
      this.fileFetcher('/html/editor/editView.html', '#edit-view')
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
