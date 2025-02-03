document.addEventListener('alpine:init', () => {
  Alpine.data('tooltip', text => ({
    text,
    tooltipEl: null,

    show(event) {
      if (!this.tooltipEl) {
        this.tooltipEl = document.createElement('div')
        this.tooltipEl.className =
          'fixed px-2 py-1 text-xs text-white bg-black bg-opacity-90 rounded shadow-lg transition-opacity duration-200'
        this.tooltipEl.style.position = 'absolute'
        this.tooltipEl.style.whiteSpace = 'nowrap'
        this.tooltipEl.innerText = this.text
        document.body.appendChild(this.tooltipEl)
      }
      this.updatePosition(event)
    },

    hide() {
      if (this.tooltipEl) {
        this.tooltipEl.remove()
        this.tooltipEl = null
      }
    },

    updatePosition(event) {
      if (this.tooltipEl) {
        const tooltipRect = this.tooltipEl.getBoundingClientRect()
        let x = event.clientX + 10
        let y = event.clientY + 10

        // Prevent overflow
        if (x + tooltipRect.width > window.innerWidth) {
          x = window.innerWidth - tooltipRect.width - 10
        }
        if (y + tooltipRect.height > window.innerHeight) {
          y = window.innerHeight - tooltipRect.height - 10
        }

        this.tooltipEl.style.left = `${x}px`
        this.tooltipEl.style.top = `${y}px`
      }
    },

    init() {
      this.$el.addEventListener('mouseenter', event => this.show(event))
      this.$el.addEventListener('mousemove', event => this.updatePosition(event))
      this.$el.addEventListener('mouseleave', () => this.hide())
    },
  }))
})
