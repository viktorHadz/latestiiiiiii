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

  // Updates Localstorage
  Alpine.store('globalState', {
    updateLocalStorage(key, value) {
      localStorage.setItem(key, JSON.stringify(value))
    },

    loadFromLocalStorage(key) {
      return JSON.parse(localStorage.getItem(key)) || []
    },
  })

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
    getDimensions(svgString) {
      // Regex
      const heightRegx = /height="([^"]+)"/
      const widthRegx = /width="([^"]+)/
      // Extract from string
      const heightMatch = svgString.match(heightRegx)
      const widthMatch = svgString.match(widthRegx)
      // Parse matches or null if no match
      const height = heightMatch ? heightMatch[1] : null
      const width = widthMatch ? widthMatch[1] : null

      return { height, width }
    },
    // Helper function to get the string only (called on the clientside)
    getSvgContent(name, options = {}) {
      return this.getSvg(name, options).svg
    },
    getSvg(name, options = {}) {
      // Find the SVG in the cache
      const svgObj = this.svgCache.find(item => item.name === name)
      if (!svgObj) {
        throw new Error('SVG not found')
      }

      let svgContent = svgObj.content

      // Replaces height and width in the SVG if options are provided
      if (options.height || options.width) {
        if (options.height) {
          svgContent = svgContent.replace(
            /height="([^"]+)"/,
            `height="${options.height}"`,
          )
        }
        if (options.width) {
          svgContent = svgContent.replace(
            /width="([^"]+)"/,
            `width="${options.width}"`,
          )
        }
      }
      // Extracts updated or existing height and width
      const { height, width } = this.getDimensions(svgContent)

      return { svg: svgContent, height, width }
    },
  })
  Alpine.data('tabManager', () => ({
    tabSelected: 'clients',
    tabContent: '',
    isLoading: true, // Set initial loading state to true for animation at the start of the app
    mode: localStorage.getItem('theme') || 'light',
    svgCache: [],
    sideBar: JSON.parse(localStorage.getItem('sideBar')) || false,

    async init() {
      // Ensure isLoading is initially set to true, then trigger content load
      await this.loadInitialContent()
      if (this.mode === 'dark') {
        document.documentElement.classList.add('dark')
      }
    },
    sideBarOpen() {
      this.sideBar = !this.sideBar
      localStorage.setItem('sideBar', this.sideBar)
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
