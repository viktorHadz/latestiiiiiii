// app.js
import itemEditor from '/components/items/itemEditor.js'
import clientManager from '/Managers/clientManager.js'
import invoiceManager from '/Managers/invoiceManager.js'
import editorManager from '/Managers/editorManager.js'

document.addEventListener('alpine:init', () => {
  console.log('[App.js] Alpine initialized')

  Alpine.data('tabManager', () => ({
    tabSelected: Alpine.$persist('').as('tabSelected'),
    globalTabContent: Alpine.$persist('').as('globalTabContent'),
    isLoading: true,
    sideBar: Alpine.$persist(true).as('sideBar'),

    init() {
      console.log('[TabManager] init()')
      // Watch for the store finishing fetch
      this.$watch('$store.clients.isFetched', value => {
        if (value) {
          console.log('[TabManager] isFetched changed to true!')
          this.onClientsFetched()
        }
      })

      // Attempt loading content right away
      this.loadTabContent(this.tabSelected || 'clients')
      this.isLoading = false
    },

    onClientsFetched() {
      // Example: if you want to do something special once clients are fetched
      const store = Alpine.store('clients')
      console.log('[TabManager] Clients =>', store.clients)

      if (!store.selectedClient && store.clients.length > 0) {
        // The store will open the select modal automatically, so we do nothing
        console.log('[TabManager] No selected client but store handles it.')
      }
    },

    async loadTabContent(tabName) {
      try {
        console.log('[TabManager] Loading tab content for:', tabName)
        const response = await fetch(`/html/${tabName}.html`)
        if (!response.ok) {
          throw new Error(`Failed to load ${tabName}.html: ${response.statusText}`)
        }
        const content = await response.text()
        this.tabSelected = tabName
        this.globalTabContent = content
        this.initTabComponent(tabName)
      } catch (err) {
        console.error(`[TabManager] Error loading ${tabName} content:`, err)
      }
    },

    // For the highlighted sidebar button
    tabButtonClicked(globalTabName) {
      if (this.tabSelected !== globalTabName) {
        this.loadTabContent(globalTabName)
      }
    },

    // Quick "active" check for buttons
    tabContentActive(globalTabName) {
      return this.tabSelected === globalTabName
    },

    initTabComponent(tabName) {
      // Once the HTML is inserted, register the relevant Alpine data
      if (tabName === 'clients') {
        Alpine.data('clientManager', clientManager)
      } else if (tabName === 'invoices') {
        Alpine.data('invoiceManager', invoiceManager)
      } else if (tabName === 'editor') {
        Alpine.data('editorManager', editorManager)
      }
    },

    sideBarOpen() {
      this.sideBar = !this.sideBar
    },
  }))

  // Initialize other data managers globally (if needed)
  Alpine.data('clientManager', clientManager)
  Alpine.data('itemEditor', itemEditor)
  Alpine.data('invoiceManager', invoiceManager)
  Alpine.data('editorManager', editorManager)
})
