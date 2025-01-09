import itemEditor from '/components/items/itemEditor.js'
import clientManager from '/Managers/clientManager.js'
import invoiceManager from '/Managers/invoiceManager.js'
import editorManager from '/Managers/editorManager.js'
import toastManager from '/Managers/toastManager.js'

// Initialize toastManager and assigns it to window
window.toastManager = toastManager()
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
    tabSelected: Alpine.$persist('').as('tabSelected'), // No default forced here
    globalTabContent: Alpine.$persist('').as('globalTabContent'),
    isLoading: true,
    svgCache: [],
    sideBar: Alpine.$persist(true).as('sideBar'),

    async init() {
      console.log('>>---- Tab Manager Initialized')

      const clientsExist = await Alpine.store('clientStore').fetchClients()
      const selectedClient = localStorage.getItem('selectedClient')
      if (!clientsExist) {
        console.warn('No clients exist. Redirecting to clients manager for creation.')
        await this.loadTabContent('clients')
        Alpine.store('clientStore').openClientCreationModal()
        return
      }

      // If clients exist but no client is selected
      if (!selectedClient) {
        console.warn('Clients available but no client selected. Opening client selection modal.')
        await this.loadTabContent('clients')
        Alpine.store('clientStore').openModal()
        return
      }

      // If a client exists and is selected, proceed normally
      if (!this.tabSelected) {
        await this.loadTabContent('clients')
      } else {
        await this.loadTabContent(this.tabSelected)
      }

      this.isLoading = false
    },
    tabContentActive(globalTabName) {
      return this.tabSelected === globalTabName
    },

    async loadTabContent(globalTabName) {
      try {
        const response = await fetch(`/html/${globalTabName}.html`)
        const content = await response.text()
        this.tabSelected = globalTabName // Persist tab selection
        this.globalTabContent = content // Persist content

        this.initTabComponent(globalTabName)
      } catch (error) {
        console.error(`Error loading tab content for ${globalTabName}:`, error)
      }
    },

    async initTabComponent(globalTabName) {
      this.isLoading = false
      if (globalTabName === 'clients') {
        Alpine.data('clientManager', clientManager)
      } else if (globalTabName === 'invoices') {
        Alpine.data('invoiceManager', invoiceManager)
      } else if (globalTabName === 'editor') {
        Alpine.data('editorManager', editorManager)
      }
    },

    sideBarOpen() {
      this.sideBar = !this.sideBar
    },

    async tabButtonClicked(globalTabName) {
      if (this.tabSelected !== globalTabName) {
        await this.changeTab(globalTabName)
      }
    },

    async changeTab(globalTabName) {
      this.isLoading = true
      setTimeout(async () => {
        await this.loadTabContent(globalTabName)
        this.isLoading = false
      }, 200)
    },
  }))
  // Initialization of component managers
  Alpine.data('clientManager', clientManager)
  Alpine.data('itemEditor', itemEditor)
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
