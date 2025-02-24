// app.js
import itemEditor from '/Managers/itemEditor.js'
import clientManager from '/Managers/clientManager.js'
import invoiceManager2 from '/Managers/invoicing/invoiceManager2.js'
import editorMain from '/Managers/invoEditor/editorMain.js'

document.addEventListener('alpine:init', () => {
  console.log('[App.js] Alpine initialized')
  Alpine.data('tabManager', () => ({
    tabSelected: Alpine.$persist('').as('tabSelected'),
    tabHtml: Alpine.$persist('').as('tabHtml'),
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

      // Attempts loading content right away
      this.loadTabContent(this.tabSelected || 'clients')
    },

    onClientsFetched() {
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
        this.tabHtml = content
        this.initTabComponent(tabName)
      } catch (err) {
        console.error(`[TabManager] Error loading ${tabName} content:`, err)
      }
    },

    // When a tab button is clicked
    tabButtonClicked(globalTabName) {
      if (this.tabSelected !== globalTabName) {
        this.loadTabContent(globalTabName)
      }
    },

    // Quick "active" check for buttons - returns boolean
    tabContentActive(globalTabName) {
      return this.tabSelected === globalTabName
    },

    initTabComponent(tabName) {
      // Once the HTML is inserted, register the relevant Alpine data
      if (tabName === 'clients') {
        Alpine.data('clientManager', clientManager)
      } else if (tabName === 'invoices2') {
        Alpine.data('invoiceManager2', invoiceManager2)
      } else if (tabName === 'editor') {
        // Alpine.data('editorManager', editorManager)
        Alpine.data('editorMain', editorMain)
      }
    },

    sideBarOpen() {
      this.sideBar = !this.sideBar
    },
  }))

  Alpine.data('clientManager', clientManager)
  Alpine.data('itemEditor', itemEditor)
  Alpine.data('invoiceManager2', invoiceManager2)
  Alpine.data('editorMain', editorMain)
})
