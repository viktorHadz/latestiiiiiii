document.addEventListener('alpine:init', () => {
  Alpine.data('tooltip', (text, opts = {}) => ({
    text,
    tooltipEl: null,
    hidden: opts.hidden || false,
    position: opts.position || 'bottom',

    show(event) {
      if (!this.tooltipEl) {
        this.tooltipEl = document.createElement('div')
        this.tooltipEl.className = this.hidden
          ? 'hidden'
          : 'fixed px-2 py-1 text-xs text-white bg-black bg-opacity-90 rounded shadow-lg transition-opacity duration-200 z-[99]'
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
        const triggerRect = this.$el.getBoundingClientRect()

        let x, y

        switch (this.position) {
          case 'bottom':
            x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
            y = triggerRect.bottom + 8
            break
          case 'left':
            x = triggerRect.left - tooltipRect.width - 8
            y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
            break
          case 'right':
            x = triggerRect.right + 8
            y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2
            break
          case 'top':
          default:
            x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2
            y = triggerRect.top - tooltipRect.height - 8
            break
        }

        // Prevent overflow
        if (x < 0) x = 8
        if (x + tooltipRect.width > window.innerWidth) x = window.innerWidth - tooltipRect.width - 8
        if (y < 0) y = 8
        if (y + tooltipRect.height > window.innerHeight) y = window.innerHeight - tooltipRect.height - 8

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
