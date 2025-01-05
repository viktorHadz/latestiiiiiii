document.addEventListener('alpine:init', () => {
  Alpine.store('svgCache', {
    svgCache: [],

    async init() {
      console.log('4. OO--> svgCache Store is initialized')
      await this.getSvgCache()
      console.log('  _ Svg\'s is loaded: \n', this.svgCache)
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
    // Wrapper called on the frontend
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
          svgContent = svgContent.replace(/height="([^"]+)"/, `height="${options.height}"`)
        }
        if (options.width) {
          svgContent = svgContent.replace(/width="([^"]+)"/, `width="${options.width}"`)
        }
      }
      // Extracts updated or existing height and width
      const { height, width } = this.getDimensions(svgContent)

      return { svg: svgContent, height, width }
    },
  })
})
