document.addEventListener('alpine:init', () => {
  Alpine.store('fetchHtml', {
    init() {
      console.log('3. OO--> fetchHtml Store is initialized')
    },
    async fetchHtmls(url, targetSelector) {
      try {
        if (!url) throw new Error('fetchHtml: No URL provided.')
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`fetchHtml: Failed to fetch ${url}. Status: ${response.status}`)
        }

        const content = await response.text()

        // If targetSelector is provided, inject the content directly
        if (targetSelector) {
          const targetElement = document.querySelector(targetSelector)
          if (targetElement) {
            targetElement.innerHTML = content
          } else {
            console.warn(`fetchHtml: Target element "${targetSelector}" not found.`)
          }
        }

        console.log(`fetchHtml: Content fetched successfully from ${url}`)
        return content
      } catch (error) {
        console.error('fetchHtml Error:', error)
        return null
      }
    },
  })
})
