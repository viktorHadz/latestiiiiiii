// import componentManager from './public/componentsLibrary/components.js';
import clientManager from './clientManager.js'
import stylesManager from './stylesManager.js'
import invoiceManager from './invoiceManager.js'
import editorManager from './editorManager.js'
import toastManager from './toastManager.js'
// TEMPLATING: Put the logic of select client into the reusable element's html using an alpine data and then just load the element. This will allow me to template

// window.componentManager = componentManager()
// Initialize toastManager and assigns it to window
window.toastManager = toastManager()
// Bind calls to the toast manager
window.callToast = window.toastManager.callToast.bind(window.toastManager)
window.callError = window.toastManager.toastError.bind(window.toastManager)
window.callSuccess = window.toastManager.toastSuccess.bind(window.toastManager)
window.callWarning = window.toastManager.toastWarning.bind(window.toastManager)
window.callInfo = window.toastManager.toastInfo.bind(window.toastManager)

// document.body.addEventListener('htmx:afterOnLoad', function (e) {
//   if (e.target.matches('[hx-get="/public/images/edit-2.svg"]')) {
//     console.log('HTMX Load Event:', e.target, e.detail)
//   }
// })

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

// MARK: Alpine load
document.addEventListener('alpine:init', () => {
  // document.body.addEventListener('htmx:afterRequest', function (e) {
  //   console.log('HTMX Request Completed:', e.target, e.detail)
  // })
  // Icons called after content loaded
  Alpine.store('svgCache', {
    svgCache: [],

    async init() {
      await this.getSvgCache()
      console.log(this.svgCache)
    },
    async getSvgCache() {
      try {
        const response = await fetch('/getSvg')
        if (!response.ok) {
          throw new Error(`Couldn't get SVGs server error: ${response.status}`)
        }
        this.svgCache = await response.json()
      } catch (error) {
        console.error(error.message)
      }
    },
    getSvgContent(name) {
      const svg = this.svgCache.find(item => item.name === name)
      return svg ? svg.content : ''
    },
  })
  Alpine.data('tabManager', () => ({
    tabSelected: 'clients',
    tabContent: '',
    isLoading: true, // Set initial loading state to true for animation at the start of the app
    mode: localStorage.getItem('theme') || 'light',

    sideBar: false,
    svgCache: [],

    // MARK: Select Client
    openSelectClient: false,
    showDropdown: false,
    selectedClient: {},
    clients: [],
    sideBarOpen() {
      this.sideBar = !this.sideBar
    },

    async init() {
      // Ensure isLoading is initially set to true, then trigger content load
      await this.loadInitialContent()
      if (this.mode === 'dark') {
        document.documentElement.classList.add('dark')
      }
    },
    // MARK: Clients
    getClients() {
      this.clients = clientsManager.clients
    },

    toggleTheme() {
      this.mode = this.mode === 'light' ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', this.mode === 'dark')
      localStorage.setItem('theme', this.mode)
      console.log(this.mode)
    },
    async loadInitialContent() {
      // Load initial content
      await this.loadTabContent('clients')
      this.isLoading = false // Enter transition
    },

    async tabButtonClicked(tabName) {
      await this.changeTab(tabName)
    },

    tabContentActive(tabName) {
      return this.tabSelected === tabName
    },

    async changeTab(tabName) {
      this.isLoading = true // Trigger leave transition

      setTimeout(async () => {
        await this.loadTabContent(tabName)
        this.isLoading = false // Trigger enter transition
      }, 200) // Adjust timeout to match transition duration
    },

    async loadTabContent(tabName) {
      const response = await fetch(`/${tabName}.html`)
      const content = await response.text()
      this.tabSelected = tabName

      this.$nextTick(() => {
        this.tabContent = content
        this.initTabComponent(tabName)
        // Neeed to also call it inside the init statement of each
        // console.log('loading icons')
        // feather.replace()
      })
    },

    initTabComponent(tabName) {
      if (tabName === 'styles') {
        Alpine.data('stylesManager', stylesManager)
      } else if (tabName === 'clients') {
        Alpine.data('clientManager', clientManager)
      } else if (tabName === 'invoices') {
        Alpine.data('invoiceManager', invoiceManager)
      } else if (tabName === 'editor') {
        Alpine.data('editorManager', editorManager)
      }
    },
  }))

  Alpine.data('clientManager', clientManager)
  Alpine.data('stylesManager', stylesManager)
  Alpine.data('invoiceManager', invoiceManager)
  Alpine.data('editorManager', editorManager)
  Alpine.data('toastManager', toastManager)
})
