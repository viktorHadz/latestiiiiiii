document.addEventListener('alpine:init', () => {
  Alpine.store('fetcher', {
    tog: false,

    init() {
      console.log('[filetFetcher] Initialising')
    },

    get(path, element) {
      fetch(path)
        .then(res => res.text())
        .then(injected => {
          const el = document.querySelector(element)
          el.innerHTML = injected
          console.log(`[get] Loaded ${file}`)
        })
        .catch(err => console.log('Error fetching path: ', err))
    },

    /**
     * Fetches an HTML file and injects its content into a target element, then initializes Alpine.js on the injected content.
     *
     * @param {string} file - The path to the HTML file to fetch.
     * @param {string} target - The CSS selector of the target element where the fetched HTML will be injected.
     * @returns {void}
     */
    getAlpine(file, target) {
      fetch(file)
        .then(res => res.text())
        .then(html => {
          const targetElement = document.querySelector(target)
          targetElement.innerHTML = html
          Alpine.initTree(targetElement)
          // Ensure Alpine updates dynamically injected content
          Alpine.nextTick(() => {
            console.log(`[get-alpine] Loaded ${file}`)
          })
        })
        .catch(err => console.error(err))
    },
    kill() {},

    toggle() {
      this.tog === false ? (this.tog = true) : (this.tog = false)
    },
  })
})
