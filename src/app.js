import clientManager from './Managers/clientManager.js'
import itemEditor from './components/items/itemEditor.js'
import themeToggler from './components/toggleTheme/themeToggler.js'
import invoiceManager from './Managers/invoiceManager.js'
import editorManager from './Managers/editorManager.js'
import toastManager from './Managers/toastManager.js'

// window.componentManager = componentManager()
// Initialize toastManager and assigns it to window
window.toastManager = toastManager()
// Bind calls to the toast manager
window.callToast = window.toastManager.callToast.bind(window.toastManager)
window.callError = window.toastManager.toastError.bind(window.toastManager)
window.callSuccess = window.toastManager.toastSuccess.bind(window.toastManager)
window.callWarning = window.toastManager.toastWarning.bind(window.toastManager)
window.callInfo = window.toastManager.toastInfo.bind(window.toastManager)

// Create a MutationObserver to automatically process HTMX attributes
const htmxObserver = new MutationObserver(mutationsList => {
  for (const mutation of mutationsList) {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType !== Node.ELEMENT_NODE) return

      if (hasHTMXAttributes(node)) {
        htmx.process(node)
      }

      node.querySelectorAll &&
        node
          .querySelectorAll(
            '[hx-get], [hx-post], [hx-put], [hx-delete], [hx-patch], [hx-trigger], [hx-swap], [hx-target], [hx-select], [hx-include], [hx-push-url], [hx-vals]',
          )
          .forEach(el => {
            htmx.process(el)
          })
    })
  }
})

htmxObserver.observe(document.body, { childList: true, subtree: true })

function hasHTMXAttributes(node) {
  return (
    node.hasAttribute &&
    (node.hasAttribute('hx-get') ||
      node.hasAttribute('hx-post') ||
      node.hasAttribute('hx-put') ||
      node.hasAttribute('hx-delete') ||
      node.hasAttribute('hx-patch') ||
      node.hasAttribute('hx-trigger') ||
      node.hasAttribute('hx-swap') ||
      node.hasAttribute('hx-target') ||
      node.hasAttribute('hx-select') ||
      node.hasAttribute('hx-include') ||
      node.hasAttribute('hx-push-url') ||
      node.hasAttribute('hx-vals'))
  )
}

document.addEventListener('alpine:init', () => {
  console.log('##---- App.js --> Alpine initializes in App js')
  Alpine.data('tabManager', () => ({
    tabSelected: Alpine.$persist(''),
    globalTabContent: '',
    isLoading: true, // Set initial loading state to true for animation at the start of the app
    svgCache: [],
    sideBar: JSON.parse(localStorage.getItem('sideBar')) || false,

    async init() {
      console.log('>>!!---- Tab Manager --> initialized')
      const store = Alpine.store('clientStore')
      
      const selectedClient = JSON.parse(localStorage.getItem('selectedClient'))
      if (store.clients && store.clients.length) {
        alert('Clients in db')
      }
      if (!selectedClient) {
        alert('Please select a client first')
      }
      await this.loadInitialContent()
    },
    loadHtml() {
      console.log('slider opan baby')
    },
    sideBarOpen() {
      this.sideBar = !this.sideBar
      localStorage.setItem('sideBar', this.sideBar)
    },
    
    async loadInitialContent() {
      // Load initial content
      await this.loadTabContent('clients')
      this.isLoading = false // Enter transition
    },

    async tabButtonClicked(globalTabName) {
      await this.changeTab(globalTabName)
    },

    tabContentActive(globalTabName) {
      return this.tabSelected === globalTabName
    },

    async changeTab(globalTabName) {
      this.isLoading = true // Trigger leave transition

      setTimeout(async () => {
        await this.loadTabContent(globalTabName)
        this.isLoading = false // Trigger enter transition
      }, 200) // Adjust timeout to match transition duration
    },

    async loadTabContent(globalTabName) {
      const response = await fetch(`/${globalTabName}.html`)
      const content = await response.text()
      this.tabSelected = globalTabName

      this.$nextTick(() => {
        this.globalTabContent = content
        this.initTabComponent(globalTabName)
      })
    },

    initTabComponent(globalTabName) {
      if (globalTabName === 'clients') {
        Alpine.data('clientManager', clientManager)
      } else if (globalTabName === 'invoices') {
        Alpine.data('invoiceManager', invoiceManager)
      } else if (globalTabName === 'editor') {
        Alpine.data('editorManager', editorManager)
      }
    },
  }))
  Alpine.data('clientManager', clientManager)
  Alpine.data('itemEditor', itemEditor)
  Alpine.data('themeToggler', themeToggler)
  Alpine.data('invoiceManager', invoiceManager)
  Alpine.data('editorManager', editorManager)
  Alpine.data('toastManager', toastManager)
})
document.addEventListener('alpine:initialized', () => {
  if (Alpine) {
    console.log('##----------------------->Alpine and its dependencies started <-----------------------##')
  } else {
    console.log('No Alpine')
  }
})
